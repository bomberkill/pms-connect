import { configureStore } from '@reduxjs/toolkit';
import auth from './slices/authSlice';

// export const makeStore = () => {return 
//     configureStore({
//         reducer: {
//             counter: counterReducer,
//         },
//     })
// }

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth,
    }
  })
}

export type AppStore = ReturnType<typeof makeStore>;
// export type RootState = ReturnType<typeof store.getState>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
// export type AppDispatch = typeof store.dispatch;

// export default store;