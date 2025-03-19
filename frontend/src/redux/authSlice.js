import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  access_token: localStorage.getItem("writenest_token") || null,
  user: JSON.parse(localStorage.getItem("writenest_user")) || null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authenticate: (state, { payload }) => {
      state.user = payload;
      state.access_token = payload.access_token;
      localStorage.setItem("writenest_token", payload.access_token);
      localStorage.setItem("writenest_user", JSON.stringify(payload));
    },
    logout: (state) => {
      state.user = null;
      state.access_token = null;
      localStorage.removeItem("writenest_token");
      localStorage.removeItem("writenest_user");
    },
    updateProfileImg: (state, { payload }) => {
      state.user.profile_img = payload;
      localStorage.setItem("writenest_user", JSON.stringify(state.user));
    },
    updateUsername: (state, { payload }) => {
      state.user.username = payload;
      localStorage.setItem("writenest_user", JSON.stringify(state.user));
    },
  },
});

export const { authenticate, logout, updateProfileImg, updateUsername } =
  authSlice.actions;
export default authSlice.reducer;
