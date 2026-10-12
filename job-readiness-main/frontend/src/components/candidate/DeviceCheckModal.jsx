import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import {
  Camera,
  Mic,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Play,
  VideoOff
} from 'lucide-react';

export const DeviceCheckModal = ({ isOpen, onClose, onProceed, assessmentTitle }) => {
  const [stream, setStream] = useState(null);
  const [cameraStatus, setCameraStatus] = useState('checking'); // 'checking' | 'active' | 'error' | 'disconnected'
  const [micStatus, setMicStatus] = useState('checking'); // 'checking' | 'active' | 'error' | 'disconnected'
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const videoRef = useRef(null);
  const isProceedingRef = useRef(false);

  const requestMediaDevices = async () => {
    setIsVerifying(true);
    setErrorMessage('');
    setCameraStatus('checking');
    setMicStatus('checking');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevice API is not supported in this browser environment.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 } },
        audio: true
      });

      const videoTracks = mediaStream.getVideoTracks();
      const audioTracks = mediaStream.getAudioTracks();

      if (videoTracks.length > 0 && videoTracks[0].readyState === 'live') {
        setCameraStatus('active');
        videoTracks[0].onended = () => setCameraStatus('disconnected');
      } else {
        setCameraStatus('error');
      }

      if (audioTracks.length > 0 && audioTracks[0].readyState === 'live') {
        setMicStatus('active');
        audioTracks[0].onended = () => setMicStatus('disconnected');
      } else {
        setMicStatus('error');
      }

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Device permission error:', err);
      const name = err.name || '';

      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        if (err.message && err.message.toLowerCase().includes('audio')) {
          setMicStatus('error');
          setErrorMessage('Microphone access is required to start this assessment. Please allow microphone access in your browser settings.');
        } else if (err.message && err.message.toLowerCase().includes('video')) {
          setCameraStatus('error');
          setErrorMessage('Camera access is required to start this assessment. Please allow camera access in your browser settings.');
        } else {
          setCameraStatus('error');
          setMicStatus('error');
          setErrorMessage('Camera and microphone access are required to start this assessment. Please allow access in your browser permissions.');
        }
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setCameraStatus('error');
        setMicStatus('error');
        setErrorMessage('Required hardware devices (Camera / Microphone) were not found on your system.');
      } else {
        setCameraStatus('error');
        setMicStatus('error');
        setErrorMessage('Camera or Microphone permission request failed. Please check your browser settings.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      isProceedingRef.current = false;
      requestMediaDevices();
    }

    return () => {
      if (!isProceedingRef.current && stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleProceed = () => {
    if (cameraStatus === 'active' && micStatus === 'active' && stream) {
      isProceedingRef.current = true;
      onProceed(stream);
    }
  };

  const isReady = cameraStatus === 'active' && micStatus === 'active';

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        onClose();
      }}
      title="Hardware Device Verification"
      subtitle={`Pre-assessment camera and microphone check for "${assessmentTitle || 'Assessment'}"`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-5 text-xs text-slate-700">
        
        {/* Privacy Note */}
        <div className="p-3.5 bg-brand-50/70 border border-brand-200 rounded-2xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
            Camera and microphone are used only for the exam environment. No audio or video is recorded, uploaded, or stored.
          </p>
        </div>

        {/* Live Camera Preview Box */}
        <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-300 shadow-inner flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${cameraStatus === 'active' ? 'block' : 'hidden'}`}
          />

          {cameraStatus !== 'active' && (
            <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
              {isVerifying ? (
                <>
                  <RefreshCw className="w-8 h-8 animate-spin text-brand-500" />
                  <span className="font-semibold text-slate-300">Requesting Camera & Microphone Access...</span>
                </>
              ) : (
                <>
                  <VideoOff className="w-10 h-10 text-slate-500" />
                  <span className="font-semibold text-slate-300">Camera Preview Unavailable</span>
                  <span className="text-[11px] text-slate-500">Allow camera permission in browser to view live preview</span>
                </>
              )}
            </div>
          )}

          {/* Overlay Status Badge */}
          {cameraStatus === 'active' && (
            <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-950/80 backdrop-blur-md rounded-lg text-white text-[10px] font-bold flex items-center gap-1.5 border border-white/10 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE PREVIEW</span>
            </div>
          )}
        </div>

        {/* Device Status Badges */}
        <div className="grid grid-cols-2 gap-3">
          {/* Camera Status */}
          <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
            cameraStatus === 'active'
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : cameraStatus === 'checking'
              ? 'bg-slate-50 border-slate-200 text-slate-700'
              : 'bg-rose-50/70 border-rose-200 text-rose-900'
          }`}>
            <div className="flex items-center gap-2">
              <Camera className={`w-4 h-4 ${cameraStatus === 'active' ? 'text-emerald-600' : 'text-slate-500'}`} />
              <div className="flex flex-col">
                <span className="font-bold text-[11px]">Camera</span>
                <span className="text-[10px] font-medium">
                  {cameraStatus === 'active' ? '✓ Camera Active' : cameraStatus === 'checking' ? 'Checking...' : 'Disconnected / Denied'}
                </span>
              </div>
            </div>
            {cameraStatus === 'active' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500" />
            )}
          </div>

          {/* Microphone Status */}
          <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
            micStatus === 'active'
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : micStatus === 'checking'
              ? 'bg-slate-50 border-slate-200 text-slate-700'
              : 'bg-rose-50/70 border-rose-200 text-rose-900'
          }`}>
            <div className="flex items-center gap-2">
              <Mic className={`w-4 h-4 ${micStatus === 'active' ? 'text-emerald-600' : 'text-slate-500'}`} />
              <div className="flex flex-col">
                <span className="font-bold text-[11px]">Microphone</span>
                <span className="text-[10px] font-medium">
                  {micStatus === 'active' ? '✓ Microphone Active' : micStatus === 'checking' ? 'Checking...' : 'Disconnected / Denied'}
                </span>
              </div>
            </div>
            {micStatus === 'active' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500" />
            )}
          </div>
        </div>

        {/* Error Alert Message */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          {!isReady && (
            <button
              type="button"
              onClick={requestMediaDevices}
              disabled={isVerifying}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>Retry Device Check</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleProceed}
            disabled={!isReady}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
              isReady
                ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Proceed to Assessment</span>
          </button>
        </div>

      </div>
    </Modal>
  );
};
