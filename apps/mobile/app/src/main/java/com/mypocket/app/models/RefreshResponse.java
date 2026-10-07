package com.mypocket.app.models;

import com.google.gson.annotations.SerializedName;

public class RefreshResponse {
    @SerializedName("success")
    private boolean success;

    @SerializedName("data")
    private RefreshData data;

    public boolean isSuccess() {
        return success;
    }

    public RefreshData getData() {
        return data;
    }

    public static class RefreshData {
        @SerializedName("accessToken")
        private String accessToken;

        @SerializedName("refreshToken")
        private String refreshToken;

        public String getAccessToken() {
            return accessToken;
        }

        public String getRefreshToken() {
            return refreshToken;
        }
    }
}
