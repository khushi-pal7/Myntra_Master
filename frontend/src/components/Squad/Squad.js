import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SquadLanding from './SquadLanding';
import SquadRoom from './SquadRoom';
import SquadJoin from './SquadJoin';
import './Squad.css';

const Squad = () => {
    return (
        <Routes>
            <Route path="/" element={<SquadLanding />} />
            <Route path="/room/:roomCode" element={<SquadRoom />} />
            <Route path="/join/:roomCode" element={<SquadJoin />} />
        </Routes>
    );
};

export default Squad;
