import {
    CREATE_SQUAD_ROOM_REQUEST, CREATE_SQUAD_ROOM_SUCCESS, CREATE_SQUAD_ROOM_FAIL,
    GET_MY_SQUAD_ROOMS_REQUEST, GET_MY_SQUAD_ROOMS_SUCCESS, GET_MY_SQUAD_ROOMS_FAIL,
    GET_SQUAD_ROOM_DETAILS_REQUEST, GET_SQUAD_ROOM_DETAILS_SUCCESS, GET_SQUAD_ROOM_DETAILS_FAIL,
    JOIN_SQUAD_ROOM_REQUEST, JOIN_SQUAD_ROOM_SUCCESS, JOIN_SQUAD_ROOM_FAIL,
    GET_ROOM_INFO_REQUEST, GET_ROOM_INFO_SUCCESS, GET_ROOM_INFO_FAIL,
    SEND_INVITE_REQUEST, SEND_INVITE_SUCCESS, SEND_INVITE_FAIL,
    CLOSE_ROOM_SUCCESS,
    ADD_SQUAD_MESSAGE, SET_SQUAD_MESSAGES, UPDATE_SQUAD_VOTES, UPDATE_SQUAD_REACTIONS,
    CLEAR_SQUAD_ERRORS
} from '../action/squadaction';

// ── Squad Rooms Reducer ───────────────────────────────────────────
export const squadRoomsReducer = (state = { rooms: [], loading: false }, action) => {
    switch (action.type) {
        case GET_MY_SQUAD_ROOMS_REQUEST:
            return { ...state, loading: true };
        case GET_MY_SQUAD_ROOMS_SUCCESS:
            return { ...state, loading: false, rooms: action.payload };
        case GET_MY_SQUAD_ROOMS_FAIL:
            return { ...state, loading: false, error: action.payload };
        case CLEAR_SQUAD_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

// ── Create Room Reducer ───────────────────────────────────────────
export const createSquadRoomReducer = (state = { room: null, loading: false }, action) => {
    switch (action.type) {
        case CREATE_SQUAD_ROOM_REQUEST:
            return { ...state, loading: true, success: false };
        case CREATE_SQUAD_ROOM_SUCCESS:
            return { ...state, loading: false, room: action.payload, success: true };
        case CREATE_SQUAD_ROOM_FAIL:
            return { ...state, loading: false, error: action.payload, success: false };
        case CLEAR_SQUAD_ERRORS:
            return { ...state, error: null, success: false };
        default:
            return state;
    }
};

// ── Room Details Reducer ──────────────────────────────────────────
export const squadRoomDetailsReducer = (state = { room: null, messages: [], loading: false }, action) => {
    switch (action.type) {
        case GET_SQUAD_ROOM_DETAILS_REQUEST:
            return { ...state, loading: true };
        case GET_SQUAD_ROOM_DETAILS_SUCCESS:
            return {
                ...state,
                loading: false,
                room: action.payload.room,
                messages: action.payload.messages
            };
        case GET_SQUAD_ROOM_DETAILS_FAIL:
            return { ...state, loading: false, error: action.payload };
        case ADD_SQUAD_MESSAGE:
            return { ...state, messages: [...state.messages, action.payload] };
        case SET_SQUAD_MESSAGES:
            return { ...state, messages: action.payload };
        case UPDATE_SQUAD_VOTES:
            if (!state.room) return state;
            return {
                ...state,
                room: {
                    ...state.room,
                    sharedProducts: state.room.sharedProducts.map(sp =>
                        sp.productId?._id === action.payload.productId || sp.productId === action.payload.productId
                            ? { ...sp, votes: action.payload.votes }
                            : sp
                    )
                }
            };
        case UPDATE_SQUAD_REACTIONS:
            if (!state.room) return state;
            return {
                ...state,
                room: {
                    ...state.room,
                    sharedProducts: state.room.sharedProducts.map(sp =>
                        sp.productId?._id === action.payload.productId || sp.productId === action.payload.productId
                            ? { ...sp, reactions: action.payload.reactions }
                            : sp
                    )
                }
            };
        case CLOSE_ROOM_SUCCESS:
            return { ...state, room: null, messages: [] };
        case CLEAR_SQUAD_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

// ── Join Room Reducer ─────────────────────────────────────────────
export const joinSquadRoomReducer = (state = { loading: false, success: false }, action) => {
    switch (action.type) {
        case JOIN_SQUAD_ROOM_REQUEST:
            return { ...state, loading: true, success: false };
        case JOIN_SQUAD_ROOM_SUCCESS:
            return { ...state, loading: false, success: true, ...action.payload };
        case JOIN_SQUAD_ROOM_FAIL:
            return { ...state, loading: false, error: action.payload, success: false };
        case CLEAR_SQUAD_ERRORS:
            return { ...state, error: null, success: false };
        default:
            return state;
    }
};

// ── Room Info Reducer (for guest join page) ───────────────────────
export const squadRoomInfoReducer = (state = { loading: false }, action) => {
    switch (action.type) {
        case GET_ROOM_INFO_REQUEST:
            return { ...state, loading: true };
        case GET_ROOM_INFO_SUCCESS:
            return { ...state, loading: false, ...action.payload };
        case GET_ROOM_INFO_FAIL:
            return { ...state, loading: false, error: action.payload };
        case CLEAR_SQUAD_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

// ── Invite Reducer ────────────────────────────────────────────────
export const squadInviteReducer = (state = { loading: false }, action) => {
    switch (action.type) {
        case SEND_INVITE_REQUEST:
            return { ...state, loading: true, success: false };
        case SEND_INVITE_SUCCESS:
            return { ...state, loading: false, success: true, inviteLink: action.payload.inviteLink, message: action.payload.message };
        case SEND_INVITE_FAIL:
            return { ...state, loading: false, error: action.payload, success: false };
        case CLEAR_SQUAD_ERRORS:
            return { ...state, error: null, success: false, inviteLink: null };
        default:
            return state;
    }
};
