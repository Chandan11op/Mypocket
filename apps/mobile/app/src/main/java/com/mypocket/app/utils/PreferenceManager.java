package com.mypocket.app.utils;

import android.content.Context;
import android.content.SharedPreferences;

public class PreferenceManager {
    private final SharedPreferences preferences;

    public PreferenceManager(Context context) {
        this.preferences = context.getSharedPreferences(Constants.PREF_NAME, Context.MODE_PRIVATE);
    }

    public void saveSession(String accessToken, String refreshToken, String userId, String name, String email, String mobile) {
        SharedPreferences.Editor editor = preferences.edit();
        editor.putString(Constants.KEY_ACCESS_TOKEN, accessToken);
        editor.putString(Constants.KEY_REFRESH_TOKEN, refreshToken);
        editor.putString(Constants.KEY_USER_ID, userId);
        editor.putString(Constants.KEY_USER_NAME, name);
        editor.putString(Constants.KEY_USER_EMAIL, email);
        editor.putString(Constants.KEY_USER_MOBILE, mobile);
        editor.apply();
    }

    public String getAccessToken() {
        return preferences.getString(Constants.KEY_ACCESS_TOKEN, null);
    }

    public String getRefreshToken() {
        return preferences.getString(Constants.KEY_REFRESH_TOKEN, null);
    }

    public String getUserName() {
        return preferences.getString(Constants.KEY_USER_NAME, "User");
    }

    public String getUserMobile() {
        return preferences.getString(Constants.KEY_USER_MOBILE, "");
    }

    public boolean isLoggedIn() {
        return getAccessToken() != null && !getAccessToken().isEmpty();
    }

    public void setOnboarded(boolean onboarded) {
        preferences.edit().putBoolean(Constants.KEY_ONBOARDED, onboarded).apply();
    }

    public boolean isOnboarded() {
        return preferences.getBoolean(Constants.KEY_ONBOARDED, false);
    }

    public String getBaseUrl() {
        return preferences.getString(Constants.KEY_BASE_URL, Constants.DEFAULT_BASE_URL);
    }

    public void saveBaseUrl(String url) {
        if (!url.endsWith("/")) {
            url += "/";
        }
        preferences.edit().putString(Constants.KEY_BASE_URL, url).apply();
    }

    public void clear() {
        preferences.edit().clear().apply();
    }
}
