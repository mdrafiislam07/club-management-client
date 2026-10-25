import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import AboutUs from './pages/AboutUs';
import Events from './pages/Events';
import Team from './pages/Team';
import Contact from './pages/Contact';
import Newsfeed from './pages/Newsfeed';
import MemberList from './pages/MemberList';
import NoticeView from './pages/NoticeView';
import Founders from './pages/Founders';
import DynamicFormView from './pages/DynamicFormView';
import EntryGate from './pages/EntryGate';

// নতুন মিটিং পেজ কম্পোনেন্টসমূহ আমদানি
import MeetingHome from './pages/MeetingHome';
import MeetingEntry from './pages/MeetingEntry';
import MeetingDetailsUser from './pages/MeetingDetailsUser';

// প্রিভিয়াস কমিটি পেজ কম্পোনেন্টসমূহ আমদানি
import PreviousCommitteesList from './pages/PreviousCommitteesList';
import CommitteeDetails from './pages/CommitteeDetails';
import CHome from './pages/cricket/CHome';
import CTeam from './pages/cricket/CTeam';
import Tournament from './pages/cricket/Tournament';
import InterTournament from './pages/cricket/InterTournament';
import CentralTournament from './pages/cricket/CentralTournament';
import FranchiseTournament from './pages/cricket/FranchiseTournament';
import InterSchedule from './pages/cricket/InterSchedule';
import CentralSchedule from './pages/cricket/CentralSchedule';
import FranchiseSchedule from './pages/cricket/FranchiseSchedule';
import Players from './pages/cricket/Players';
import LiveMatchCenter from './pages/cricket/LiveMatchCenter';
import Auction from './pages/cricket/Auction';
import LiveMatch from './pages/cricket/LiveMatch';
import PointTable from './pages/cricket/PointTable';

// Football pages
import FootballHeader from './pages/Football/FootballHeader';
import FootballHome from './pages/Football/FootballHome';
import FootballTeam from './pages/Football/FootballTeam';
import FootballTournament from './pages/Football/FootballTournament';
import FootballSchedule from './pages/Football/FootballSchedule';
import FootballAuction from './pages/Football/FootballAuction';
import FootballPointTable from './pages/Football/PointTable';

// 🏸 Badminton pages
import BadmintonLayout from './pages/Badminton/BadmintonLayout';
import BadmintonHome from './pages/Badminton/BadmintonHome';
import BadmintonTournament from './pages/Badminton/BadmintonTournament';
import BadmintonTeam from './pages/Badminton/BadmintonTeam';
import BadmintonPlayers from './pages/Badminton/BadmintonPlayers';
import BadmintonLive from './pages/Badminton/BadmintonLive';
import BadmintonSchedule from './pages/Badminton/BadmintonSchedule';
import BadmintonMatch from './pages/Badminton/BadmintonMatch';
import BadmintonPointTable from './pages/Badminton/BadmintonPointTable';
import BadmintonProjector from './pages/Badminton/BadmintonProjector'; // 📽️ projector view
import AiAgentWidget from './ai_agent_module/AiAgentWidget';

// কমন লেআউট কম্পোনেন্ট
const Layout = ({ darkMode, setDarkMode, user, content, handleLogout }) => {
  return (
    <div className={darkMode ? 'dark bg-slate-950 text-slate-100 min-h-screen transition-colors duration-300' : 'bg-[#f8fafc] text-slate-800 min-h-screen transition-colors duration-300'}>
      {/* কমন হেডার/নেভবার */}
      <Navbar 
        content={content} 
        user={user} 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        handleLogout={handleLogout} 
      />
      
      {/* মূল পেজের কন্টেন্ট */}
      <main className="pt-28">
        <Outlet />
      </main>
    </div>
  );
};

// Football er alada layout: FootballHeader (logo + BRIU Sports Club) shob football page e
const FootballLayout = ({ darkMode, setDarkMode }) => (
  <div className={darkMode ? 'dark bg-slate-950 text-slate-100 min-h-screen' : 'bg-[#f3f6f1] text-slate-800 min-h-screen'}>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500;600&display=swap" />
    <FootballHeader darkMode={darkMode} setDarkMode={setDarkMode} />
    <Outlet />
  </div>
);

function App() {
  const [content, setContent] = useState(null);
  const [user, setUser] = useState(null);

  // লোকালস্টোরেজ থেকে ডার্ক মোড স্টেট ইনিশিয়ালাইজ করা যাতে সব পেজে কাজ করে
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // ডার্ক মোড পরিবর্তন হলে এইচটিএমএল ক্লাসে অ্যাড করা এবং লোকালস্টোরেজে সেভ করা
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    // লোকালস্টোরেজ থেকে লগইন করা ইউজারের ডাটা চেক করা
    const savedUser = localStorage.getItem('clubUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    axios.get('/api/club/content')
      .then(res => {
        if (res.data) setContent(res.data);
      })
      .catch(err => console.error("Error fetching content:", err));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('clubUser');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <Router>
      <Routes>
        {/* এই রাউটগুলোর ভেতরে সব পেজে একই হেডার দেখাবে */}
        <Route element={
          <Layout 
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
            user={user} 
            content={content} 
            handleLogout={handleLogout} 
          />
        }>
          <Route path="/" element={<Home />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/team" element={<Team />} />
          <Route path="/events" element={<Events />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/register" element={<Register />} />
          <Route path="/registration" element={<Register />} />
          <Route path="/founders" element={<Founders />} />

          {/* ক্লাব মিটিং সংক্রান্ত নতুন রাউটসমূহ */}
          <Route path="/activities/meetings" element={<MeetingHome />} />
          <Route path="/activities/meetings/entry" element={<MeetingEntry />} />
          <Route path="/activities/meetings/view" element={<MeetingDetailsUser />} />

          {/* প্রিভিয়াস কমিটি সংক্রান্ত নতুন রাউটসমূহ */}
          <Route path="/members/alumni" element={<PreviousCommitteesList darkMode={darkMode} setDarkMode={setDarkMode} user={user} handleLogout={handleLogout} />} />
          <Route path="/members/alumni/:id" element={<CommitteeDetails darkMode={darkMode} setDarkMode={setDarkMode} user={user} handleLogout={handleLogout} />} />
        </Route>

        {/* আলাদা পেজ যেমন অ্যাডমিন বা লগইন */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/login" element={<Login />} />
        <Route path="/news" element={<Newsfeed />} />
        <Route path="/members/list" element={<MemberList />} />
        <Route path="/notice/general" element={<NoticeView />} />
        <Route path="/notice/registration" element={<EntryGate />} />
        
        {/* পাথ এক করার জন্য এখানে /dynamic-form এবং /Access-Form দুটোই সাপোর্ট রাখা হলো */}
        <Route path="/dynamic-form" element={<DynamicFormView />} />
        <Route path="/Access-Form" element={<DynamicFormView />} />
        <Route path="/sports/cricket" element={<CHome />} />
        <Route path="/sports/cricket/team" element={<CTeam />} />
        <Route path="/sports/cricket/tournament" element={<Tournament />} />
        <Route path="/sports/cricket/inter-tournament" element={<InterTournament />} />
        <Route path="/sports/cricket/central-tournament" element={<CentralTournament />} />
        <Route path="/sports/cricket/franchise-tournament" element={<FranchiseTournament />} />
        <Route path="/sports/cricket/inter-schedule" element={<InterSchedule />} />
        <Route path="/sports/cricket/central-schedule" element={<CentralSchedule />} />
        <Route path="/sports/cricket/franchise-schedule" element={<FranchiseSchedule />} />
        <Route path="/sports/cricket/player" element={<Players />} />
        <Route path="/sports/cricket/match/:matchId" element={<LiveMatchCenter />} />
        <Route path="/sports/cricket/auction" element={<Auction />} />
        <Route path="/sports/cricket/live" element={<LiveMatch />} />
        <Route path="/sports/cricket/point-table" element={<PointTable />} />

        {/* Football: shob page FootballLayout (FootballHeader) er vitore */}
        <Route element={<FootballLayout darkMode={darkMode} setDarkMode={setDarkMode} />}>
          <Route path="/sports/football" element={<FootballHome />} />
          <Route path="/sports/football/team" element={<FootballTeam />} />
          <Route path="/sports/football/tournament" element={<FootballTournament />} />
          <Route path="/sports/football/schedule" element={<FootballSchedule />} />
          <Route path="/sports/football/point-table" element={<FootballPointTable />} />
          <Route path="/sports/football/auction" element={<FootballAuction />} />
        </Route>

        {/* 📽️ Badminton projector: header chhara fullscreen, tai BadmintonLayout er BAIRE */}
        <Route path="/sports/table-tennis/projector" element={<BadmintonProjector />} />

        {/* 🏸 Badminton: path '/sports/table-tennis' (menu te "Badminton"). shob page BadmintonLayout (header) er vitore */}
        <Route element={<BadmintonLayout darkMode={darkMode} setDarkMode={setDarkMode} />}>
          <Route path="/sports/table-tennis" element={<BadmintonHome />} />
          <Route path="/sports/table-tennis/tournament" element={<BadmintonTournament />} />
          <Route path="/sports/table-tennis/team" element={<BadmintonTeam />} />
          <Route path="/sports/table-tennis/players" element={<BadmintonPlayers />} />
          <Route path="/sports/table-tennis/live" element={<BadmintonLive />} />
          <Route path="/sports/table-tennis/schedule" element={<BadmintonSchedule />} />
          <Route path="/sports/table-tennis/schedule/:id" element={<BadmintonSchedule />} />
          <Route path="/sports/table-tennis/match/:id" element={<BadmintonMatch />} />
          <Route path="/sports/table-tennis/point-table" element={<BadmintonPointTable />} />
        </Route>
      </Routes>
       <AiAgentWidget />
    </Router>
  );
}

export default App;