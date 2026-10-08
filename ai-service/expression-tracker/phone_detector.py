"""
phone_detector.py
=================
Detects mobile phones in webcam frames using YOLOv4-tiny via OpenCV DNN.
Downloads model files on first run (~24MB total), cached locally.

Usage:
    detector = PhoneDetector()
    detected = detector.detect(frame)  # True/False
"""

import os
import cv2
import numpy as np
import urllib.request

_DIR = os.path.dirname(os.path.abspath(__file__))
_MODELS_DIR = os.path.join(_DIR, "models")

_WEIGHTS_URL = "https://github.com/AlexeyAB/darknet/releases/download/yolov4/yolov4-tiny.weights"
_CFG_URL = "https://raw.githubusercontent.com/AlexeyAB/darknet/master/cfg/yolov4-tiny.cfg"

_WEIGHTS_PATH = os.path.join(_MODELS_DIR, "yolov4-tiny.weights")
_CFG_PATH = os.path.join(_MODELS_DIR, "yolov4-tiny.cfg")

# COCO class index for "cell phone" is 67
_PHONE_CLASS_ID = 67
_CONFIDENCE_THRESHOLD = 0.40
_NMS_THRESHOLD = 0.4


def _download_if_missing(url: str, dest: str) -> bool:
    """Download a file if it doesn't exist locally."""
    if os.path.exists(dest):
        return True
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    print(f"[PhoneDetector] Downloading {os.path.basename(dest)} ...")
    try:
        urllib.request.urlretrieve(url, dest)
        print(f"[PhoneDetector] Downloaded -> {dest}")
        return True
    except Exception as e:
        print(f"[PhoneDetector] Download failed: {e}")
        return False


class PhoneDetector:
    """Detects mobile phones using YOLOv4-tiny (OpenCV DNN backend).

    On first instantiation, downloads model weights and config (~24MB).
    Subsequent runs use the cached files.
    """

    def __init__(self, confidence: float = _CONFIDENCE_THRESHOLD):
        self._confidence = confidence
        self._net = None
        self._output_layers: list = []
        self._ready = False
        self._load_model()

    def _load_model(self) -> None:
        """Load YOLOv4-tiny model into OpenCV DNN."""
        weights_ok = _download_if_missing(_WEIGHTS_URL, _WEIGHTS_PATH)
        cfg_ok = _download_if_missing(_CFG_URL, _CFG_PATH)

        if not (weights_ok and cfg_ok):
            print("[PhoneDetector] Model files unavailable - phone detection disabled")
            return

        try:
            self._net = cv2.dnn.readNetFromDarknet(_CFG_PATH, _WEIGHTS_PATH)
            self._net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)
            self._net.setPreferableTarget(cv2.dnn.DNN_TARGET_CPU)

            layer_names = self._net.getLayerNames()
            out_indices = self._net.getUnconnectedOutLayers()
            # OpenCV returns either 1D or 2D array depending on version
            if out_indices.ndim == 1:
                self._output_layers = [layer_names[i - 1] for i in out_indices]
            else:
                self._output_layers = [layer_names[i[0] - 1] for i in out_indices]

            self._ready = True
            print("[PhoneDetector] YOLOv4-tiny loaded [OK]")
        except Exception as e:
            print(f"[PhoneDetector] Failed to load model: {e}")
            self._ready = False

    def detect(self, frame: np.ndarray) -> bool:
        """Return True if a mobile phone is detected in the frame."""
        if not self._ready or frame is None or frame.size == 0:
            return False

        h, w = frame.shape[:2]

        # Create blob from frame (416x416 input for YOLOv4-tiny)
        blob = cv2.dnn.blobFromImage(frame, 1 / 255.0, (416, 416), swapRB=True, crop=False)
        self._net.setInput(blob)

        try:
            outputs = self._net.forward(self._output_layers)
        except Exception:
            return False

        # Parse detections
        for output in outputs:
            for detection in output:
                scores = detection[5:]
                class_id = int(np.argmax(scores))
                confidence = float(scores[class_id])

                if class_id == _PHONE_CLASS_ID and confidence >= self._confidence:
                    return True

        return False
