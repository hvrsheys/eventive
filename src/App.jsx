import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import venuePhoto from './assets/venue-dinner.jpeg'
import seats from './data/seats.json'
import {
  clearLocalAttendanceRecords,
  deleteLocalAttendanceRecord,
  readLocalAttendanceRecords,
  recordAttendance,
  writeLocalAttendanceRecords,
} from './services/attendance'

const tables = {
  1: { x: 815, y: 240, label: '1' },
  2: { x: 640, y: 240, label: '2' },
  3: { x: 360, y: 240, label: '3' },
  4: { x: 185, y: 240, label: '4' },
  5: { x: 815, y: 455, label: '5' },
  6: { x: 640, y: 455, label: '6' },
  7: { x: 360, y: 455, label: '7' },
  8: { x: 185, y: 455, label: '8' },
}

const visibleTables = Object.entries(tables).map(([id, table]) => ({
  id: Number(id),
  ...table,
}))

function App() {
  const [query, setQuery] = useState('')
  const [selectedGuest, setSelectedGuest] = useState(null)
  const [showAttendance, setShowAttendance] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [attendanceStatus, setAttendanceStatus] = useState('')
  const [isRecordingAttendance, setIsRecordingAttendance] = useState(false)
  const activeAttendanceRecordId = useRef(null)

  const normalizedQuery = query.trim().toLowerCase()

  useEffect(() => {
    window.eventiveAttendance = {
      clear: clearLocalAttendanceRecords,
      delete: deleteLocalAttendanceRecord,
      list: readLocalAttendanceRecords,
      replaceAll: writeLocalAttendanceRecords,
    }

    return () => {
      delete window.eventiveAttendance
    }
  }, [])

  const filteredGuests = useMemo(() => {
    if (!normalizedQuery) {
      return []
    }

    return seats
      .filter((guest) => {
        const nameMatch = guest.name.toLowerCase().includes(normalizedQuery)
        const companyMatch = guest.company.toLowerCase().includes(normalizedQuery)
        return nameMatch || companyMatch
      })
      .slice(0, 8)
  }, [normalizedQuery])

  const selectedTable = selectedGuest ? tables[selectedGuest.table] : null
  const guidePath = selectedTable
    ? `M 500 610 L 500 ${selectedTable.y} L ${selectedTable.x} ${selectedTable.y}`
    : ''

  const chooseGuest = (guest) => {
    setSelectedGuest(guest)
    setQuery(guest.name)
    setShowAttendance(true)
  }

  const closeAttendance = () => {
    setShowAttendance(false)
  }

  const updateAttendanceStatus = (sheetStatus) => {
    if (sheetStatus === 'sent') {
      setAttendanceStatus('Attendance recorded to the sheet.')
    } else if (sheetStatus === 'not-configured') {
      setAttendanceStatus('Attendance saved on this device. Sheet connection is not configured yet.')
    } else if (sheetStatus === 'queued') {
      setAttendanceStatus('Attendance saved on this device. Sheet sync is running in the background.')
    } else {
      setAttendanceStatus('Attendance saved on this device. Sheet sync failed.')
    }
  }

  const verifyGuest = () => {
    if (!selectedGuest || isRecordingAttendance) {
      return
    }

    setIsRecordingAttendance(true)
    setAttendanceStatus('')

    const result = recordAttendance(selectedGuest, {
      onSheetStatusChange: ({ record, sheetStatus }) => {
        if (activeAttendanceRecordId.current === record.recordId) {
          updateAttendanceStatus(sheetStatus)
        }
      },
    })

    activeAttendanceRecordId.current = result.record.recordId
    updateAttendanceStatus(result.sheetStatus)

    setIsRecordingAttendance(false)
    setShowAttendance(false)
    setIsVerified(true)
  }

  const resetSearch = () => {
    setQuery('')
    setSelectedGuest(null)
    setShowAttendance(false)
    setIsVerified(false)
    setAttendanceStatus('')
    setIsRecordingAttendance(false)
    activeAttendanceRecordId.current = null
  }

  return (
    <main className={`app ${showAttendance ? 'is-dimmed' : ''}`}>
      <div className="corner-frame corner-frame--top" />
      <div className="corner-frame corner-frame--bottom" />
      <div className="ambient ambient--one" />
      <div className="ambient ambient--two" />

      {!isVerified ? (
        <section className="hero-screen" aria-label="Seat finder">
          <p className="eyebrow">An Evening of Celebration</p>
          <h1 className="event-title">Aurum Grand Evening</h1>
          <p className="event-subtitle">Gala Dinner / Award Ceremony / 2026</p>

          <div className="divider" aria-hidden="true">
            <span />
            <i />
            <span />
          </div>

          <section className="finder-card">
            <p className="card-kicker">Find Your Seat</p>
            <p className="finder-copy">
              Search by name or company and we will guide you to the right table.
            </p>

            <div className="autocomplete">
              <label className="sr-only" htmlFor="guest-search">
                Search guest name or company
              </label>
              <input
                id="guest-search"
                type="text"
                className="search-input"
                placeholder="Your name"
                value={query}
                autoComplete="off"
                onChange={(event) => {
                  setQuery(event.target.value)
                  setSelectedGuest(null)
                }}
              />

              {normalizedQuery && (
                <div className="suggestions" role="listbox" aria-label="Guest suggestions">
                  {filteredGuests.length > 0 ? (
                    filteredGuests.map((guest) => (
                      <button
                        key={guest.id}
                        type="button"
                        className="suggestion"
                        onClick={() => chooseGuest(guest)}
                      >
                        <span>
                          <strong>{guest.name}</strong>
                          <small>{guest.company}</small>
                        </span>
                        <em>Table {guest.table}</em>
                      </button>
                    ))
                  ) : (
                    <p className="no-results">No matching guest found. Please try another spelling.</p>
                  )}
                </div>
              )}
            </div>
          </section>

          <aside className="hero-venue" aria-label="Event venue preview">
            <img src={venuePhoto} alt="Banquet hall prepared for a gala dinner" />
          </aside>

          <footer className="page-footer">
            <div className="divider divider--small" aria-hidden="true">
              <span />
              <i />
              <span />
            </div>
            <p>For assistance, please approach our registration desk.</p>
          </footer>
        </section>
      ) : (
        <section className="map-screen" aria-label="Seat map">
          <p className="eyebrow">Seat Map</p>
          <h1 className="event-title">Walk to Your Table</h1>
          <p className="event-subtitle">
            Follow the highlighted route from the entrance to your assigned table.
          </p>

          <div className="map-layout">
            <aside className="guest-panel">
              <h2>Guest Details</h2>
              <p className="panel-copy">
                Your attendance is confirmed. Keep this screen open as you walk in.
              </p>

              <div className="guest-card">
                <span>Selected Guest</span>
                <strong>{selectedGuest.name}</strong>
                <em>Assigned to Table {selectedGuest.table}</em>
              </div>

              <button type="button" className="ghost-button" onClick={resetSearch}>
                Reset
              </button>

              <p className="presence-note">
                {attendanceStatus || `${selectedGuest.name} is marked present at Table ${selectedGuest.table}.`}
              </p>
            </aside>

            <section className="seat-map-card" aria-label="Seat map with selected table">
              <div className="stage">Stage</div>
              <div className="map-canvas">
                <svg
                  className="guidance-layer"
                  viewBox="0 0 1000 650"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <circle className="guidance-dot" r="9">
                    <animateMotion
                      key={`${selectedGuest.id}-${selectedGuest.table}`}
                      dur="1.65s"
                      fill="freeze"
                      path={guidePath}
                    />
                  </circle>
                </svg>

                <div className="red-carpet">
                  <span>Entrance</span>
                </div>

                {visibleTables.map((table) => (
                  <div
                    key={table.id}
                    className={`table-orb ${
                      selectedGuest.table === table.id ? 'table-orb--selected' : ''
                    }`}
                    style={{
                      '--x': `${table.x / 10}%`,
                      '--y': `${table.y / 6.5}%`,
                    }}
                  >
                    {table.label}
                  </div>
                ))}

                <div
                  className="seat-callout"
                  style={{
                    '--x': `${selectedTable.x / 10}%`,
                    '--y': `${selectedTable.y / 6.5}%`,
                  }}
                >
                  You are seated here, Table {selectedGuest.table}
                </div>
              </div>
            </section>
          </div>
        </section>
      )}

      {showAttendance && selectedGuest && (
        <section className="modal-shell" role="dialog" aria-modal="true" aria-labelledby="verify-title">
          <div className="attendance-modal">
            <p className="modal-eyebrow">Attendance Check</p>
            <h2 id="verify-title">Please Verify You Are Seated</h2>
            <p>
              Please verify your attendance before we guide you to Table{' '}
              {selectedGuest.table}.
            </p>
            <button
              type="button"
              className="primary-button"
              onClick={verifyGuest}
              disabled={isRecordingAttendance}
            >
              {isRecordingAttendance ? 'Recording...' : 'Verify and Show Map'}
            </button>
            <button type="button" className="secondary-button" onClick={closeAttendance}>
              Not Yet
            </button>
          </div>
        </section>
      )}
    </main>
  )
}

export default App
