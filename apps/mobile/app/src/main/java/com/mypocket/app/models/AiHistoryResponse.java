package com.mypocket.app.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class AiHistoryResponse {
    @SerializedName("success")
    private boolean success;

    @SerializedName("data")
    private Data data;

    public boolean isSuccess() {
        return success;
    }

    public List<ChatItem> getHistory() {
        return data != null ? data.history : null;
    }

    public static class Data {
        @SerializedName("history")
        private List<ChatItem> history;
    }

    public static class ChatItem {
        @SerializedName("id")
        private String id;

        @SerializedName("role")
        private String role; // user or assistant

        @SerializedName("message")
        private String message;

        public String getRole() {
            return role;
        }

        public String getMessage() {
            return message;
        }
    }
}
