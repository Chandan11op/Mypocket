package com.mypocket.app.models;

import com.google.gson.annotations.SerializedName;

public class AiChatRequest {
    @SerializedName("message")
    private String message;

    public AiChatRequest(String message) {
        this.message = message;
    }
}
