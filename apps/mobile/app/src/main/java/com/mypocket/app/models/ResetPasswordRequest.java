package com.mypocket.app.models;

import com.google.gson.annotations.SerializedName;

public class ResetPasswordRequest {
    @SerializedName("reset_token")
    private String resetToken;

    @SerializedName("new_password")
    private String newPassword;

    public ResetPasswordRequest(String resetToken, String newPassword) {
        this.resetToken = resetToken;
        this.newPassword = newPassword;
    }
}
