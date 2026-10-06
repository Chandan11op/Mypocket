package com.mypocket.app.models;

import com.google.gson.annotations.SerializedName;

public class ForgotPasswordRequest {
    @SerializedName("identifier")
    private String identifier;

    public ForgotPasswordRequest(String identifier) {
        this.identifier = identifier;
    }
}
