import React, { useState, useEffect, useRef } from 'react';
import { Camera, AlertTriangle, ShieldCheck, UserCheck, UserX, Users, EyeOff } from 'lucide-react';

export const MediaPreviewWidget = ({
  stream,
  videoRef: externalVideoRef,
  proctorState = null,
  violationCount = 0,
  isDetecting = false,
}) => {
  const localVideoRef = useRef(null);
  const videoRef = externalVideoRef || localVideoRef;

  const [cameraActive, setCameraActive] = useState(true);
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    if (stream) {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      const videoTracks = stream.getVideoTracks();

      if (videoTracks.length > 0) {
        setCameraActive(videoTracks[0].readyState === 'live');
        videoTracks[0].onended = () => {
          setCameraActive(false);
          setWarningMessage('Camera connection interrupted.');
        };
      }
    }
  }, [stream, videoRef]);

  if (!stream) return null;

  const getStatusBadge = () => {
    if (!isDetecting) {
      return {
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
        text: 'Proctor Standby',
        icon: <ShieldCheck className="w-3 h-3 text-slate-500" />
      };
    }

    const status = proctorState?.status;
    switch (status) {
      case 'face_ok':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500 animate-pulse',
          text: 'Face OK (Centered)',
          icon: <UserCheck className="w-3 h-3 text-emerald-600" />
        };
      case 'looking_away': {
        const gaze = proctorState?.gazeDirection;
        let badgeText = 'Looking Away';
        if (gaze === 'down') badgeText = 'Eyes Down (Diverted)';
        else if (gaze === 'left') badgeText = 'Eyes Left (Diverted)';
        else if (gaze === 'right') badgeText = 'Eyes Right (Diverted)';
        else if (gaze === 'up') badgeText = 'Eyes Up (Diverted)';
        else if (proctorState?.reason?.includes('right')) badgeText = 'Face Turned Right';
        else if (proctorState?.reason?.includes('left')) badgeText = 'Face Turned Left';
        else if (proctorState?.reason?.includes('downwards')) badgeText = 'Face Tilted Down';
        else if (proctorState?.reason?.includes('upwards')) badgeText = 'Face Tilted Up';

        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          dot: 'bg-amber-500 animate-bounce',
          text: badgeText,
          icon: <EyeOff className="w-3 h-3 text-amber-600" />
        };
      }
      case 'no_face':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          dot: 'bg-rose-500 animate-ping',
          text: 'No Face Detected',
          icon: <UserX className="w-3 h-3 text-rose-600" />
        };
      case 'multiple_faces':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          dot: 'bg-rose-500 animate-ping',
          text: 'Multiple Faces',
          icon: <Users className="w-3 h-3 text-rose-600" />
        };
      default:
        return {
          bg: 'bg-sky-50 text-sky-700 border-sky-200',
          dot: 'bg-sky-500 animate-pulse',
          text: 'Initializing AI...',
          icon: <ShieldCheck className="w-3 h-3 text-sky-600" />
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl p-2.5 w-48 flex flex-col gap-2 transition-all">
      {/* 160x120 aspect live preview */}
      <div className="relative w-full h-[120px] bg-slate-950 rounded-xl overflow-hidden border border-slate-300/80 shadow-inner">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]"
        />

        {/* Top-left LIVE badge */}
        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-slate-950/80 backdrop-blur-xs rounded text-[9px] font-bold text-white flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${cameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span>LIVE</span>
        </div>

        {/* Top-right Warning Strikes Counter Pill */}
        <div className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-extrabold flex items-center gap-1 border shadow-xs ${
          violationCount === 0
            ? 'bg-slate-900/80 text-emerald-300 border-slate-700'
            : violationCount === 1
            ? 'bg-amber-500 text-white border-amber-600'
            : violationCount === 2
            ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
            : 'bg-rose-700 text-white border-rose-900'
        }`}>
          <span>Warnings: {violationCount}/3</span>
        </div>
      </div>

      {/* Proctoring Face State Status Pill */}
      <div className={`flex items-center justify-between px-2 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${statusBadge.bg}`}>
        <div className="flex items-center gap-1.5">
          {statusBadge.icon}
          <span className="truncate">{statusBadge.text}</span>
        </div>
        <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
      </div>

      {/* Camera device health */}
      <div className="flex items-center justify-between px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[9px] text-slate-600 font-semibold">
        <div className="flex items-center gap-1">
          <Camera className="w-2.5 h-2.5 text-slate-500" />
          <span>{cameraActive ? 'Webcam Active' : 'Camera Disconnected'}</span>
        </div>
        <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">160×120</span>
      </div>

      {/* Disconnection Warning Banner if Disconnected */}
      {warningMessage && (
        <div className="p-1.5 bg-rose-50 border border-rose-200 rounded-lg text-[9px] text-rose-800 font-bold flex items-center gap-1 animate-pulse leading-tight">
          <AlertTriangle className="w-3 h-3 text-rose-600 flex-shrink-0" />
          <span>{warningMessage}</span>
        </div>
      )}

      {/* Legal/Ethical Privacy Notice */}
      <div className="text-[8px] text-slate-400 text-center font-medium leading-tight pt-0.5 border-t border-slate-100">
        Continuous client-side face proctoring • No video recorded
      </div>
    </div>
  );
};
