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
import { Raids } from './pages/Raids/Raids'
import { BossRaids } from './pages/BossRaids/BossRaids'
import { Clans } from './pages/Clans/Clans'
import { Marketplace } from './pages/Marketplace/Marketplace'
import { PvP } from './pages/PvP/PvP'
import { Construction } from './pages/Construction/Construction'
import { Classes } from './pages/Classes/Classes'
import { Missions } from './pages/Missions/Missions'
import { Trust } from './pages/Trust/Trust'
import { Settings } from './pages/Settings/Settings'

export default function App() {
  const mode = useUIStore(state => state.mode)
  
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Refuge />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/node" element={<NodeView />} />
        <Route path="/combat" element={<Combat />} />
        <Route path="/refuge" element={<Refuge />} />
        <Route path="/social" element={<Social />} />
        <Route path="/map" element={<Map />} />
        <Route path="/crafting" element={<Crafting />} />
        <Route path="/economy" element={<Economy />} />
        <Route path="/quests" element={<Quests />} />
        <Route path="/raids" element={<Raids />} />
        <Route path="/boss-raids" element={<BossRaids />} />
        <Route path="/clans" element={<Clans />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/pvp" element={<PvP />} />
        <Route path="/construction" element={<Construction />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/missions" element={<Missions />} />
        <Route path="/trust" element={<Trust />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  )
}

