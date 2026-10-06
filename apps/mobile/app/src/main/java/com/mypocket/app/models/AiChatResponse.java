package com.mypocket.app.models;

import com.google.gson.annotations.SerializedName;

public class AiChatResponse {
    @SerializedName("success")
    private boolean success;

    @SerializedName("message")
    private String message;

    @SerializedName("data")
    private Data data;

    public boolean isSuccess() {
        return success;
    }

    public String getReply() {
        if (data != null && data.reply != null) {
            return data.reply;
        }
        return message;
    }

    public static class Data {
        @SerializedName("reply")
        private String reply;
    }
}
