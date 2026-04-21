import axios from 'axios';

// Action Types
export const CREATE_SQUAD_ROOM_REQUEST = 'CREATE_SQUAD_ROOM_REQUEST';
export const CREATE_SQUAD_ROOM_SUCCESS = 'CREATE_SQUAD_ROOM_SUCCESS';
export const CREATE_SQUAD_ROOM_FAIL = 'CREATE_SQUAD_ROOM_FAIL';

export const GET_MY_SQUAD_ROOMS_REQUEST = 'GET_MY_SQUAD_ROOMS_REQUEST';
export const GET_MY_SQUAD_ROOMS_SUCCESS = 'GET_MY_SQUAD_ROOMS_SUCCESS';
export const GET_MY_SQUAD_ROOMS_FAIL = 'GET_MY_SQUAD_ROOMS_FAIL';

export const GET_SQUAD_ROOM_DETAILS_REQUEST = 'GET_SQUAD_ROOM_DETAILS_REQUEST';
export const GET_SQUAD_ROOM_DETAILS_SUCCESS = 'GET_SQUAD_ROOM_DETAILS_SUCCESS';
export const GET_SQUAD_ROOM_DETAILS_FAIL = 'GET_SQUAD_ROOM_DETAILS_FAIL';

export const JOIN_SQUAD_ROOM_REQUEST = 'JOIN_SQUAD_ROOM_REQUEST';
export const JOIN_SQUAD_ROOM_SUCCESS = 'JOIN_SQUAD_ROOM_SUCCESS';
export const JOIN_SQUAD_ROOM_FAIL = 'JOIN_SQUAD_ROOM_FAIL';

export const GET_ROOM_INFO_REQUEST = 'GET_ROOM_INFO_REQUEST';
export const GET_ROOM_INFO_SUCCESS = 'GET_ROOM_INFO_SUCCESS';
export const GET_ROOM_INFO_FAIL = 'GET_ROOM_INFO_FAIL';

export const SEND_INVITE_REQUEST = 'SEND_INVITE_REQUEST';
export const SEND_INVITE_SUCCESS = 'SEND_INVITE_SUCCESS';
export const SEND_INVITE_FAIL = 'SEND_INVITE_FAIL';

export const SHARE_PRODUCT_REQUEST = 'SHARE_PRODUCT_REQUEST';
export const SHARE_PRODUCT_SUCCESS = 'SHARE_PRODUCT_SUCCESS';
export const SHARE_PRODUCT_FAIL = 'SHARE_PRODUCT_FAIL';

export const VOTE_PRODUCT_REQUEST = 'VOTE_PRODUCT_REQUEST';
export const VOTE_PRODUCT_SUCCESS = 'VOTE_PRODUCT_SUCCESS';
export const VOTE_PRODUCT_FAIL = 'VOTE_PRODUCT_FAIL';

export const REACT_PRODUCT_REQUEST = 'REACT_PRODUCT_REQUEST';
export const REACT_PRODUCT_SUCCESS = 'REACT_PRODUCT_SUCCESS';
export const REACT_PRODUCT_FAIL = 'REACT_PRODUCT_FAIL';

export const CLOSE_ROOM_REQUEST = 'CLOSE_ROOM_REQUEST';
export const CLOSE_ROOM_SUCCESS = 'CLOSE_ROOM_SUCCESS';
export const CLOSE_ROOM_FAIL = 'CLOSE_ROOM_FAIL';

export const ADD_SQUAD_MESSAGE = 'ADD_SQUAD_MESSAGE';
export const SET_SQUAD_MESSAGES = 'SET_SQUAD_MESSAGES';
export const UPDATE_SQUAD_VOTES = 'UPDATE_SQUAD_VOTES';
export const UPDATE_SQUAD_REACTIONS = 'UPDATE_SQUAD_REACTIONS';
export const CLEAR_SQUAD_ERRORS = 'CLEAR_SQUAD_ERRORS';

// ── Create Room ───────────────────────────────────────────────────
export const createSquadRoom = (roomName) => async (dispatch) => {
    try {
        dispatch({ type: CREATE_SQUAD_ROOM_REQUEST });

        const { data } = await axios.post('/api/v1/squad/create', { roomName });

        dispatch({
            type: CREATE_SQUAD_ROOM_SUCCESS,
            payload: data.room
        });
    } catch (error) {
        dispatch({
            type: CREATE_SQUAD_ROOM_FAIL,
            payload: error.response?.data?.message || 'Failed to create room'
        });
    }
};

// ── Get My Rooms ──────────────────────────────────────────────────
export const getMySquadRooms = () => async (dispatch) => {
    try {
        dispatch({ type: GET_MY_SQUAD_ROOMS_REQUEST });

        const { data } = await axios.get('/api/v1/squad/rooms');

        dispatch({
            type: GET_MY_SQUAD_ROOMS_SUCCESS,
            payload: data.rooms
        });
    } catch (error) {
        dispatch({
            type: GET_MY_SQUAD_ROOMS_FAIL,
            payload: error.response?.data?.message || 'Failed to fetch rooms'
        });
    }
};

// ── Get Room Details ──────────────────────────────────────────────
export const getSquadRoomDetails = (roomCode) => async (dispatch) => {
    try {
        dispatch({ type: GET_SQUAD_ROOM_DETAILS_REQUEST });

        const guestToken = localStorage.getItem(`squad_guest_${roomCode}`);
        const config = guestToken
            ? { headers: { Authorization: `Bearer ${guestToken}` } }
            : {};

        const { data } = await axios.get(`/api/v1/squad/room/${roomCode}`, config);

        dispatch({
            type: GET_SQUAD_ROOM_DETAILS_SUCCESS,
            payload: { room: data.room, messages: data.messages }
        });
    } catch (error) {
        dispatch({
            type: GET_SQUAD_ROOM_DETAILS_FAIL,
            payload: error.response?.data?.message || 'Failed to fetch room'
        });
    }
};

// ── Get Room Info (for guest join page, no auth) ──────────────────
export const getRoomInfo = (roomCode) => async (dispatch) => {
    try {
        dispatch({ type: GET_ROOM_INFO_REQUEST });

        const { data } = await axios.get(`/api/v1/squad/room-info/${roomCode}`);

        dispatch({
            type: GET_ROOM_INFO_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: GET_ROOM_INFO_FAIL,
            payload: error.response?.data?.message || 'Room not found'
        });
    }
};

// ── Join Room (guest) ─────────────────────────────────────────────
export const joinSquadRoom = (roomCode, displayName) => async (dispatch) => {
    try {
        dispatch({ type: JOIN_SQUAD_ROOM_REQUEST });

        const { data } = await axios.post(`/api/v1/squad/join/${roomCode}`, {
            displayName
        });

        // Store guest token in localStorage (persists 7 days)
        localStorage.setItem(`squad_guest_${roomCode}`, data.guestToken);
        localStorage.setItem(`squad_guest_name_${roomCode}`, displayName);
        localStorage.setItem(`squad_guest_id_${roomCode}`, data.guest._id);

        dispatch({
            type: JOIN_SQUAD_ROOM_SUCCESS,
            payload: {
                guestToken: data.guestToken,
                guest: data.guest,
                room: data.room
            }
        });
    } catch (error) {
        dispatch({
            type: JOIN_SQUAD_ROOM_FAIL,
            payload: error.response?.data?.message || 'Failed to join room'
        });
    }
};

// ── Join Room as Logged-in User ───────────────────────────────────
export const joinRoomAsUser = (roomCode) => async (dispatch) => {
    try {
        dispatch({ type: JOIN_SQUAD_ROOM_REQUEST });

        const { data } = await axios.post(`/api/v1/squad/join-as-user/${roomCode}`);

        dispatch({
            type: JOIN_SQUAD_ROOM_SUCCESS,
            payload: { room: data.room }
        });
    } catch (error) {
        dispatch({
            type: JOIN_SQUAD_ROOM_FAIL,
            payload: error.response?.data?.message || 'Failed to join room'
        });
    }
};

// ── Send Invite ───────────────────────────────────────────────────
export const sendSquadInvite = (roomCode, phone, frontendBaseUrl) => async (dispatch) => {
    try {
        dispatch({ type: SEND_INVITE_REQUEST });

        const { data } = await axios.post('/api/v1/squad/invite', {
            roomCode,
            phone,
            frontendBaseUrl
        });

        dispatch({
            type: SEND_INVITE_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: SEND_INVITE_FAIL,
            payload: error.response?.data?.message || 'Failed to send invite'
        });
    }
};

// ── Share Product ─────────────────────────────────────────────────
export const shareSquadProduct = (roomCode, productId, sharedBy, sharedByName, senderType) => async (dispatch) => {
    try {
        dispatch({ type: SHARE_PRODUCT_REQUEST });

        const { data } = await axios.post('/api/v1/squad/share-product', {
            roomCode,
            productId,
            sharedBy,
            sharedByName,
            senderType
        });

        dispatch({
            type: SHARE_PRODUCT_SUCCESS,
            payload: data
        });
    } catch (error) {
        dispatch({
            type: SHARE_PRODUCT_FAIL,
            payload: error.response?.data?.message || 'Failed to share product'
        });
    }
};

// ── Vote on Product ───────────────────────────────────────────────
export const voteOnProduct = (roomCode, productId, oderId, voterName, vote) => async (dispatch) => {
    try {
        dispatch({ type: VOTE_PRODUCT_REQUEST });

        const { data } = await axios.post('/api/v1/squad/vote', {
            roomCode,
            productId,
            oderId,
            voterName,
            vote
        });

        dispatch({
            type: VOTE_PRODUCT_SUCCESS,
            payload: { productId, votes: data.votes }
        });
    } catch (error) {
        dispatch({
            type: VOTE_PRODUCT_FAIL,
            payload: error.response?.data?.message || 'Failed to vote'
        });
    }
};

// ── React to Product ──────────────────────────────────────────────
export const reactToProduct = (roomCode, productId, oderId, emoji) => async (dispatch) => {
    try {
        dispatch({ type: REACT_PRODUCT_REQUEST });

        const { data } = await axios.post('/api/v1/squad/react', {
            roomCode,
            productId,
            oderId,
            emoji
        });

        dispatch({
            type: REACT_PRODUCT_SUCCESS,
            payload: { productId, reactions: data.reactions }
        });
    } catch (error) {
        dispatch({
            type: REACT_PRODUCT_FAIL,
            payload: error.response?.data?.message || 'Failed to react'
        });
    }
};

// ── Close Room ────────────────────────────────────────────────────
export const closeSquadRoom = (roomCode) => async (dispatch) => {
    try {
        dispatch({ type: CLOSE_ROOM_REQUEST });

        await axios.delete(`/api/v1/squad/room/${roomCode}`);

        dispatch({
            type: CLOSE_ROOM_SUCCESS,
            payload: roomCode
        });
    } catch (error) {
        dispatch({
            type: CLOSE_ROOM_FAIL,
            payload: error.response?.data?.message || 'Failed to close room'
        });
    }
};

// ── Resolve Product URL ───────────────────────────────────────────
export const resolveProductUrl = async (productId) => {
    try {
        const { data } = await axios.get(`/api/v1/squad/resolve-product/${productId}`);
        return data.product;
    } catch (error) {
        return null;
    }
};
