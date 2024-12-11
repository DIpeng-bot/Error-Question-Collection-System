import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    // 后续添加其他reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 忽略Date类型的序列化检查
        ignoredActionPaths: ['payload.createTime', 'payload.nextReviewTime', 'payload.lastReviewDate'],
        ignoredPaths: [
          'user.currentUser.createTime',
          'errorQuestions.items.createTime',
          'errorQuestions.items.nextReviewTime',
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store; 