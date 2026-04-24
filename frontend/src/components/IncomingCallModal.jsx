import { Phone, PhoneOff } from 'lucide-react'

export default function IncomingCallModal({ incomingCall, onAccept, onReject }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xs text-center animate-pulse-once">
        {/* Animated ring */}
        <div className="relative w-24 h-24 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-60" />
          <div className="relative w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center">
            <Phone size={36} className="text-white" />
          </div>
        </div>

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Incoming Call</p>
        <h2 className="text-xl font-bold text-gray-800 mb-6">{incomingCall.fromName}</h2>

        <div className="flex gap-3">
          <button
            onClick={onReject}
            className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            <PhoneOff size={17} /> Decline
          </button>
          <button
            onClick={onAccept}
            className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            <Phone size={17} /> Accept
          </button>
        </div>
      </div>
    </div>
  )
}
