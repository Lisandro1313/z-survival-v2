import { Routes, Route, Navigate } from 'react-router-dom'
import { useUIStore } from './store/uiStore'
import Shell from './components/layout/Shell'
import Dashboard from './pages/Dashboard/Dashboard'
import NodeView from './pages/NodeView/NodeView'
import Combat from './pages/Combat/Combat'
import Refuge from './pages/Refuge/Refuge'
import Social from './pages/Social/Social'
import Map from './pages/Map/Map'
import { Crafting } from './pages/Crafting/Crafting'
import { Economy } from './pages/Economy/Economy'
import { Quests } from './pages/Quests/Quests'

export default function App() {
  const mode = useUIStore(state => state.mode)
  
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/node" element={<NodeView />} />
        <Route path="/combat" element={<Combat />} />
        <Route path="/refuge" element={<Refuge />} />
        <Route path="/social" element={<Social />} />
        <Route path="/map" element={<Map />} />
        <Route path="/crafting" element={<Crafting />} />
        <Route path="/economy" element={<Economy />} />
        <Route path="/quests" element={<Quests />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  )
}
