import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

// Configurable proctoring thresholds
export const YAW_THRESHOLD = 25;    // Max degrees turn left/right before 'looking_away'
export const PITCH_THRESHOLD = 20;  // Max degrees tilt up/down before 'looking_away'
export const GRACE_PERIOD_MS = 1000; // Continuous violation duration before firing strike (1 second)
export const DETECTION_INTERVAL_MS = 500; // Interval between frames (0.5 seconds for responsive 1s grace evaluation)
export const MAX_ALLOWED_STRIKES = 3; // 3 warnings before auto-submission

// Eye gaze diversion thresholds (normalized 0.0 - 1.0 blendshape scores)
export const EYE_LOOK_DOWN_THRESHOLD = 0.55; // Looking down at phone, notes, or lap
export const EYE_LOOK_UP_THRESHOLD = 0.45;   // Looking up toward ceiling or secondary screen
export const EYE_LOOK_SIDE_THRESHOLD = 0.45; // Looking left or right away from screen

let landmarkerInstance = null;
let initPromise = null;

/**
 * Singleton factory to load MediaPipe FaceLandmarker with GPU delegate and CPU fallback
 */
export const getFaceLandmarker = async () => {
  if (landmarkerInstance) return landmarkerInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const wasmCdn = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm';
    const modelAssetPath = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(wasmCdn);
      landmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath,
          delegate: 'GPU',
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: 'VIDEO',
        numFaces: 2,
      });
      return landmarkerInstance;
    } catch (gpuErr) {
      console.warn('MediaPipe GPU initialization failed, falling back to CPU:', gpuErr);
      const filesetResolver = await FilesetResolver.forVisionTasks(wasmCdn);
      landmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath,
          delegate: 'CPU',
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: 'VIDEO',
        numFaces: 2,
      });
      return landmarkerInstance;
    }
  })();

  return initPromise;
};

/**
 * Converts MediaPipe face blendshapes categories array into a key-value map
 */
export const extractBlendshapes = (faceBlendshapeObj) => {
  if (!faceBlendshapeObj) return {};
  const categories = faceBlendshapeObj.categories || faceBlendshapeObj;
  if (!Array.isArray(categories)) return {};

  const map = {};
  for (let i = 0; i < categories.length; i++) {
    const item = categories[i];
    if (item && item.categoryName) {
      map[item.categoryName] = item.score || 0;
    }
  }
  return map;
};

/**
 * Estimate eye gaze direction and determine if eyes are diverted from the assessment screen.
 * Evaluates:
 * - Down: looking down toward desk, notes, keyboard, or smartphone
 * - Up: looking up toward ceiling or off-camera prompter
 * - Left: looking toward candidate's left
 * - Right: looking toward candidate's right
 */
export const estimateEyeGaze = (blendshapeObj, landmarks) => {
  const shapes = extractBlendshapes(blendshapeObj);

  // 1. Blendshapes from MediaPipe neural network
  // Down: eyeLookDownLeft, eyeLookDownRight
  const downScore = ((shapes.eyeLookDownLeft || 0) + (shapes.eyeLookDownRight || 0)) / 2;
  // Up: eyeLookUpLeft, eyeLookUpRight
  const upScore = ((shapes.eyeLookUpLeft || 0) + (shapes.eyeLookUpRight || 0)) / 2;
  // Left (candidate's left: left eye moves out, right eye moves in)
  const leftScore = ((shapes.eyeLookOutLeft || 0) + (shapes.eyeLookInRight || 0)) / 2;
  // Right (candidate's right: left eye moves in, right eye moves out)
  const rightScore = ((shapes.eyeLookInLeft || 0) + (shapes.eyeLookOutRight || 0)) / 2;

  // 2. Geometric Iris Landmark calculation (secondary confirmation & fallback)
  // MediaPipe FaceLandmarker with 478 points:
  // Left iris center: 468, Right iris center: 473
  // Right eye (in image, left side): outer 33, inner 133, top 159, bottom 145
  // Left eye (in image, right side): inner 362, outer 263, top 386, bottom 374
  let geomHoriz = 0.5; // 0.5 = centered, <0.32 = looking right, >0.68 = looking left
  let geomVert = 0.5;  // 0.5 = centered, >0.70 = looking down, <0.30 = looking up
  let hasGeom = false;

  if (landmarks && landmarks.length >= 478) {
    const irisR = landmarks[473];
    const outerR = landmarks[33];
    const innerR = landmarks[133];
    const topR = landmarks[159];
    const botR = landmarks[145];

    const irisL = landmarks[468];
    const innerL = landmarks[362];
    const outerL = landmarks[263];
    const topL = landmarks[386];
    const botL = landmarks[374];

    if (irisR && outerR && innerR && topR && botR && irisL && innerL && outerL && topL && botL) {
      const widthR = Math.max(0.0001, Math.abs(innerR.x - outerR.x));
      const heightR = Math.max(0.0001, Math.abs(botR.y - topR.y));
      const widthL = Math.max(0.0001, Math.abs(outerL.x - innerL.x));
      const heightL = Math.max(0.0001, Math.abs(botL.y - topL.y));

      const ratioHorizR = (irisR.x - Math.min(outerR.x, innerR.x)) / widthR;
      const ratioHorizL = (irisL.x - Math.min(innerL.x, outerL.x)) / widthL;
      const ratioVertR = (irisR.y - Math.min(topR.y, botR.y)) / heightR;
      const ratioVertL = (irisL.y - Math.min(topL.y, botL.y)) / heightL;

      geomHoriz = (ratioHorizR + ratioHorizL) / 2;
      geomVert = (ratioVertR + ratioVertL) / 2;
      hasGeom = true;
    }
  }

  // Determine primary direction if any threshold exceeded
  let isDiverted = false;
  let gazeDirection = 'center';
  let reason = 'Eyes focused on screen';
  let message = 'Eyes focused on the assessment screen.';

  // Check Downward gaze (looking at phone, notes, or desk)
  if (downScore > EYE_LOOK_DOWN_THRESHOLD || (hasGeom && geomVert > 0.72 && downScore > 0.40)) {
    isDiverted = true;
    gazeDirection = 'down';
    reason = 'Eyes directed downwards (looking away)';
    message = 'Eyes looking away (downwards) — Please keep your eyes focused on the assessment screen.';
  }
  // Check Lateral Left gaze
  else if (leftScore > EYE_LOOK_SIDE_THRESHOLD || (hasGeom && geomHoriz > 0.70 && leftScore > 0.35)) {
    isDiverted = true;
    gazeDirection = 'left';
    reason = 'Eyes directed to the left (looking away)';
    message = 'Eyes looking away (to the left) — Please keep your eyes focused on the assessment screen.';
  }
  // Check Lateral Right gaze
  else if (rightScore > EYE_LOOK_SIDE_THRESHOLD || (hasGeom && geomHoriz < 0.30 && rightScore > 0.35)) {
    isDiverted = true;
    gazeDirection = 'right';
    reason = 'Eyes directed to the right (looking away)';
    message = 'Eyes looking away (to the right) — Please keep your eyes focused on the assessment screen.';
  }
  // Check Upward gaze
  else if (upScore > EYE_LOOK_UP_THRESHOLD || (hasGeom && geomVert < 0.28 && upScore > 0.35)) {
    isDiverted = true;
    gazeDirection = 'up';
    reason = 'Eyes directed upwards (looking away)';
    message = 'Eyes looking away (upwards) — Please keep your eyes focused on the assessment screen.';
  }

  return {
    isGazeDiverted: isDiverted,
    gazeDirection,
    reason,
    message,
    scores: {
      down: Number(downScore.toFixed(3)),
      up: Number(upScore.toFixed(3)),
      left: Number(leftScore.toFixed(3)),
      right: Number(rightScore.toFixed(3)),
    }
  };
};

/**
 * Estimate Head Pose (Yaw, Pitch, Roll) in degrees
 * Uses transformation matrix when provided, with landmark geometric cross-validation
 */
export const estimateHeadPose = (landmarks, transformMatrixObj) => {
  let matrixYaw = null;
  let matrixPitch = null;
  let matrixRoll = null;

  if (transformMatrixObj && transformMatrixObj.data) {
    const m = transformMatrixObj.data;
    if (m.length >= 16) {
      // Column-major 4x4 matrix from MediaPipe
      const m0 = m[0], m1 = m[1], m2 = m[2];
      const m4 = m[4], m5 = m[5], m6 = m[6];
      const m8 = m[8], m9 = m[9], m10 = m[10];

      const pitchRad = Math.asin(-Math.max(-1, Math.min(1, m9)));
      const yawRad = Math.atan2(m8, m10);
      const rollRad = Math.atan2(m1, m5);

      matrixPitch = pitchRad * (180 / Math.PI);
      matrixYaw = yawRad * (180 / Math.PI);
      matrixRoll = rollRad * (180 / Math.PI);
    }
  }

  // Geometric landmark backup calculation (Index points on face mesh)
  // Nose tip: 1, Forehead: 10, Chin: 152, Left cheek edge: 234, Right cheek edge: 454
  let geomYaw = 0;
  let geomPitch = 0;

  if (landmarks && landmarks.length > 454) {
    const nose = landmarks[1];
    const forehead = landmarks[10];
    const chin = landmarks[152];
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];

    if (nose && leftCheek && rightCheek) {
      const distLeft = Math.max(0.001, Math.abs(nose.x - leftCheek.x));
      const distRight = Math.max(0.001, Math.abs(rightCheek.x - nose.x));
      const yawRatio = (distLeft - distRight) / (distLeft + distRight);
      geomYaw = Math.max(-60, Math.min(60, yawRatio * 55));
    }

    if (nose && forehead && chin) {
      const distTop = Math.max(0.001, Math.abs(nose.y - forehead.y));
      const distBottom = Math.max(0.001, Math.abs(chin.y - nose.y));
      const pitchRatio = (distTop - distBottom) / (distTop + distBottom);
      geomPitch = Math.max(-60, Math.min(60, pitchRatio * 50));
    }
  }

  const finalYaw = matrixYaw !== null && !isNaN(matrixYaw) ? matrixYaw : geomYaw;
  const finalPitch = matrixPitch !== null && !isNaN(matrixPitch) ? matrixPitch : geomPitch;
  const finalRoll = matrixRoll !== null && !isNaN(matrixRoll) ? matrixRoll : 0;

  return {
    yaw: finalYaw,
    pitch: finalPitch,
    roll: finalRoll,
  };
};

/**
 * Classifies a single frame detection result into one of:
 * - face_ok
 * - no_face
 * - multiple_faces
 * - looking_away (head turned or eyes diverted down/up/left/right)
 */
export const classifyFrame = (results) => {
  if (!results || !results.faceLandmarks || results.faceLandmarks.length === 0) {
    return {
      status: 'no_face',
      reason: 'No face detected in camera frame',
      message: 'Face not detected — Please face the camera directly.',
      faceCount: 0,
      yaw: 0,
      pitch: 0,
      gazeDirection: 'none',
    };
  }

  if (results.faceLandmarks.length > 1) {
    return {
      status: 'multiple_faces',
      reason: 'Multiple faces detected in frame',
      message: 'Multiple faces detected — Ensure you are alone during the assessment.',
      faceCount: results.faceLandmarks.length,
      yaw: 0,
      pitch: 0,
      gazeDirection: 'none',
    };
  }

  const landmarks = results.faceLandmarks[0];
  const matrixObj = results.facialTransformationMatrixes ? results.facialTransformationMatrixes[0] : null;
  const blendshapesObj = results.faceBlendshapes ? results.faceBlendshapes[0] : null;

  const { yaw, pitch, roll } = estimateHeadPose(landmarks, matrixObj);
  const isHeadTurned = Math.abs(yaw) > YAW_THRESHOLD || Math.abs(pitch) > PITCH_THRESHOLD;

  if (isHeadTurned) {
    let directionReason = 'Looking away from screen';
    if (Math.abs(yaw) > YAW_THRESHOLD) {
      directionReason = yaw > 0 ? 'Face turned to the right' : 'Face turned to the left';
    } else if (Math.abs(pitch) > PITCH_THRESHOLD) {
      directionReason = pitch > 0 ? 'Face tilted downwards' : 'Face tilted upwards';
    }

    return {
      status: 'looking_away',
      reason: directionReason,
      message: `Looking away from screen (${directionReason}) — Please keep your face directed toward the test screen.`,
      faceCount: 1,
      yaw: Math.round(yaw),
      pitch: Math.round(pitch),
      roll: Math.round(roll),
      gazeDirection: 'head_turned',
    };
  }

  // Head is oriented toward screen: Now evaluate eye gaze direction
  const eyeGaze = estimateEyeGaze(blendshapesObj, landmarks);
  if (eyeGaze.isGazeDiverted) {
    return {
      status: 'looking_away',
      reason: eyeGaze.reason,
      message: eyeGaze.message,
      faceCount: 1,
      yaw: Math.round(yaw),
      pitch: Math.round(pitch),
      roll: Math.round(roll),
      gazeDirection: eyeGaze.gazeDirection,
      gazeScores: eyeGaze.scores,
    };
  }

  return {
    status: 'face_ok',
    reason: 'Face presence and eye gaze verified',
    message: 'Face detected and eyes looking at screen.',
    faceCount: 1,
    yaw: Math.round(yaw),
    pitch: Math.round(pitch),
    roll: Math.round(roll),
    gazeDirection: 'center',
    gazeScores: eyeGaze.scores,
  };
};
