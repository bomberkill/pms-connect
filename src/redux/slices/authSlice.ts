import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  firebaseUid: string | null;
  loading: boolean; // <-- Notre nouvel état
  error: string | null;
}

const initialState: AuthState = {
  firebaseUid: null,
  loading: true, // <-- L'application commence en état de chargement
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<string>) => {
      state.firebaseUid = action.payload;
      state.loading = false; // <-- On a une réponse, le chargement est terminé
    },
    clearAuth: (state) => {
      state.firebaseUid = null;
      state.loading = false; // <-- On a une réponse, le chargement est terminé
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setAuth, clearAuth, setAuthError } = authSlice.actions;
export default authSlice.reducer;