import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react'
import { Device } from '@twilio/voice-sdk'
import { api, apiJson } from '../lib/api'

const CallContext = createContext(null)

function formatNumber(raw) {
  const digits = raw.replace(/\D/g, '')
  if (raw.startsWith('+')) return raw.replace(/\s/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return raw
}

export function CallProvider({ children }) {
  const [twilioReady, setTwilioReady] = useState(false)
  const [callError, setCallError] = useState('')
  const [incomingCall, setIncomingCall] = useState(null)
  const [activeCall, setActiveCall] = useState(null)
  const [callSeconds, setCallSeconds] = useState(0)
  const [muted, setMuted] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [callHistory, setCallHistory] = useState([])
  const [contacts, setContacts] = useState([])

  const twilioDevice = useRef(null)
  const currentCall = useRef(null)
  const currentCallRecordId = useRef(null)
  const callTimerInterval = useRef(null)

  const loadOnlineUsers = useCallback(async () => {
    try { setOnlineUsers(await apiJson('/api/users/online')) } catch (_) {}
  }, [])

  const loadCallHistory = useCallback(async () => {
    try { setCallHistory(await apiJson('/api/calls')) } catch (_) {}
  }, [])

  const loadContacts = useCallback(async () => {
    try { setContacts(await apiJson('/api/contacts')) } catch (_) {}
  }, [])

  function startTimer(remoteName, isAppCall = false) {
    setActiveCall({ remoteName, isAppCall })
    setCallSeconds(0)
    clearInterval(callTimerInterval.current)
    callTimerInterval.current = setInterval(() => setCallSeconds(s => s + 1), 1000)
  }

  async function endActiveCall(status) {
    clearInterval(callTimerInterval.current)
    callTimerInterval.current = null
    setActiveCall(null)
    currentCall.current = null
    setMuted(false)
    if (currentCallRecordId.current) {
      try {
        await api(`/api/calls/${currentCallRecordId.current}/status?status=${status}`, { method: 'PUT' })
      } catch (_) {}
      currentCallRecordId.current = null
    }
    loadCallHistory()
    loadOnlineUsers()
  }

  async function dial(rawNumber, displayName, appUsername = null, appUserId = null) {
    setCallError('')
    if (!twilioReady) { setCallError('Phone not ready yet — please wait a moment.'); return }

    const isAppCall = !!appUsername
    const to = isAppCall ? `client:${appUsername}` : formatNumber(rawNumber)
    const label = displayName || to

    try {
      let recRes
      if (isAppCall && appUserId) {
        recRes = await api(`/api/calls/${appUserId}`, { method: 'POST' })
      } else {
        recRes = await api('/api/calls/pstn', {
          method: 'POST',
          body: JSON.stringify({ calleeNumber: to }),
        })
      }
      if (recRes.ok) {
        const record = await recRes.json()
        currentCallRecordId.current = record.id
      }
    } catch (_) {}

    try {
      const call = await twilioDevice.current.connect({ params: { To: to } })
      currentCall.current = call
      call.on('accept', () => {
        startTimer(label, isAppCall)
        if (currentCallRecordId.current)
          api(`/api/calls/${currentCallRecordId.current}/status?status=ANSWERED`, { method: 'PUT' })
      })
      call.on('disconnect', () => endActiveCall('ENDED'))
      call.on('cancel', () => endActiveCall('MISSED'))
      call.on('error', (err) => { setCallError(err.message); endActiveCall('MISSED') })
      startTimer(label, isAppCall)
    } catch (e) {
      setCallError(e.message)
      endActiveCall('MISSED')
    }
  }

  async function acceptCall() {
    const { call, fromName } = incomingCall
    setIncomingCall(null)
    call.accept()
    currentCall.current = call
    call.on('disconnect', () => endActiveCall('ENDED'))
    call.on('error', () => endActiveCall('ENDED'))
    startTimer(fromName, false)
  }

  function rejectCall() {
    incomingCall.call.reject()
    setIncomingCall(null)
  }

  function hangUp() {
    if (currentCall.current) currentCall.current.disconnect()
  }

  function toggleMute() {
    if (!currentCall.current) return
    const next = !muted
    setMuted(next)
    currentCall.current.mute(next)
  }

  useEffect(() => {
    if (!localStorage.getItem('token')) return
    loadContacts()
    loadOnlineUsers()
    loadCallHistory()

    async function initTwilio() {
      try {
        const res = await api('/api/twilio/token')
        if (!res.ok) return
        const { token } = await res.json()
        const device = new Device(token, {
          logLevel: 1,
          codecPreferences: ['opus', 'pcmu'],
          edge: 'roaming',
        })
        twilioDevice.current = device
        device.on('registered', () => { setTwilioReady(true); loadOnlineUsers() })
        device.on('incoming', (call) => {
          setIncomingCall({ call, fromName: call.parameters.From || 'Unknown' })
          call.on('cancel', () => setIncomingCall(null))
        })
        device.on('error', (err) => setCallError(`Phone error (${err.code}): ${err.message}`))
        await device.register()
      } catch (e) {
        setCallError('Phone failed to initialize: ' + e.message)
      }
    }
    initTwilio()

    const onlineInterval = setInterval(loadOnlineUsers, 30_000)
    return () => {
      if (twilioDevice.current) twilioDevice.current.destroy()
      clearInterval(callTimerInterval.current)
      clearInterval(onlineInterval)
    }
  }, [])

  return (
    <CallContext.Provider value={{
      twilioReady, callError, setCallError,
      incomingCall, activeCall, callSeconds, muted,
      onlineUsers, callHistory, contacts,
      dial, acceptCall, rejectCall, hangUp, toggleMute,
      loadContacts, loadCallHistory, loadOnlineUsers,
    }}>
      {children}
    </CallContext.Provider>
  )
}

export const useCall = () => useContext(CallContext)
