import { User } from "@/types/User";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createUser, fetchUserByUid, loginAndFetchUser, updateUser } from "../services/userService";

interface UserState {
    user: User | null;
    loading: boolean;
    error: string | null;
}

const initialState: UserState = {
    user: null,
    loading: false,
    error: null,
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload
        },
        clearUser: (state) => {
            state.user = null;
        },
        // setUserLoading: (state, action: PayloadAction<boolean>) => {
        //     state.loading = action.payload;
        // },
        // setUserError: (state, action: PayloadAction<string | null>) => {
        //     state.error = action.payload;
        // },
    },
    extraReducers: (builder) => {
        builder
        .addCase(createUser.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(loginAndFetchUser.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(fetchUserByUid.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(createUser.fulfilled, (state, action: PayloadAction<User>) => {
            state.loading = false;
            state.user = action.payload;
        })
        // .addCase(loginAndFetchUser.fulfilled, (state, action: PayloadAction<User>) => {
        //     state.loading = false;
        //     state.user = action.payload;
        // })
        .addCase(fetchUserByUid.fulfilled, (state, action: PayloadAction<User>) => {
            state.loading = false;
            state.user = action.payload;
        })
        .addCase(createUser.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })
        .addCase(loginAndFetchUser.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })
        .addCase(fetchUserByUid.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })
        .addCase(updateUser.fulfilled, (state, action: PayloadAction<User>) => {
            state.loading = false;
            state.user = action.payload; // met directement à jour le user dans le store
        })
        .addCase(updateUser.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(updateUser.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });
    },
});

export const {clearUser, setUser} = userSlice.actions;
export default userSlice.reducer;