const STORAGE_KEY = 'eventive-attendance-records'
const EVENT_TIME_ZONE = 'Asia/Kuala_Lumpur'

const formatMalaysiaTimestamp = (date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: EVENT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const value = (type) => parts.find((part) => part.type === type)?.value

  return `${value('year')}-${value('month')}-${value('day')} ${value('hour')}:${value('minute')}:${value('second')} MYT`
}

export const readLocalAttendanceRecords = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export const writeLocalAttendanceRecords = (records) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const deleteLocalAttendanceRecord = (recordId) => {
  const records = readLocalAttendanceRecords()
  writeLocalAttendanceRecords(records.filter((record) => record.recordId !== recordId))
}

export const clearLocalAttendanceRecords = () => {
  localStorage.removeItem(STORAGE_KEY)
}

const updateLocalRecordStatus = (recordId, sheetStatus) => {
  const records = readLocalAttendanceRecords()
  writeLocalAttendanceRecords(
    records.map((record) => (record.recordId === recordId ? { ...record, sheetStatus } : record)),
  )
}

export const recordAttendance = (guest, options = {}) => {
  const now = new Date()
  const recordedAt = formatMalaysiaTimestamp(now)
  const recordedAtIso = now.toISOString()
  const recordId = `${guest.id}-${recordedAtIso}`
  const record = {
    recordId,
    recordedAt,
    recordedAtIso,
    event: 'Aurum Grand Evening',
    guestId: guest.id,
    name: guest.name,
    company: guest.company,
    table: guest.table,
    timezone: EVENT_TIME_ZONE,
  }

  const localRecords = readLocalAttendanceRecords()
  writeLocalAttendanceRecords([...localRecords, { ...record, sheetStatus: 'pending' }])

  const setSheetStatus = (sheetStatus) => {
    updateLocalRecordStatus(recordId, sheetStatus)
    options.onSheetStatusChange?.({ record, sheetStatus })
  }

  fetch('/api/attendance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(record),
  })
    .then((response) => {
      if (response.status === 503) {
        setSheetStatus('not-configured')
        return
      }

      if (!response.ok) {
        setSheetStatus('failed')
        return
      }

      setSheetStatus('sent')
    })
    .catch(() => {
      setSheetStatus('failed')
    })

  return { record, sheetStatus: 'queued' }
}
