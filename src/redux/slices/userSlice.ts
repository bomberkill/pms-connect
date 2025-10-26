import { User } from "@/types/User";
import { createSlice, isAnyOf, PayloadAction } from "@reduxjs/toolkit";
import { createUser, fetchMe, fetchUserByUid, followUser, loginAndFetchUser, removeConnection, unfollowUser, updateUser } from "../services/userService";

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
        .addCase(removeConnection.fulfilled, (state) => {
            state.loading = false;
            // No state change needed here, as fetchMe is dispatched
        })
        .addCase(followUser.fulfilled, (state) => {
            state.loading = false;
            // No state change needed here, as fetchMe is dispatched
        })
        .addCase(unfollowUser.fulfilled, (state) => {
            state.loading = false;
            // No state change needed here, as fetchMe is dispatched
        })
        .addMatcher(isAnyOf(
            createUser.fulfilled,
            loginAndFetchUser.fulfilled,
            fetchUserByUid.fulfilled,
            updateUser.fulfilled,
            fetchMe.fulfilled
        ), (state, action: PayloadAction<User>) => {
            state.loading = false;
            state.user = action.payload; // met directement à jour le user dans le store
        })
        .addMatcher(isAnyOf(
            createUser.pending,
            loginAndFetchUser.pending,
            fetchUserByUid.pending,
            updateUser.pending,
            removeConnection.pending,
            fetchMe.pending,
            followUser.pending,
            unfollowUser.pending
        ), (state) => {
            state.loading = true;
            state.error = null;
        })
        .addMatcher(isAnyOf(
            createUser.rejected,
            loginAndFetchUser.rejected,
            fetchUserByUid.rejected,
            updateUser.rejected,
            fetchMe.rejected,
            removeConnection.rejected,
            followUser.rejected,
            unfollowUser.rejected
        ), (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });
    },
});

export const {clearUser, setUser} = userSlice.actions;
export default userSlice.reducer;