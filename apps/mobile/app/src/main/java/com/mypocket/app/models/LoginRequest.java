package com.mypocket.app.models;

import com.google.gson.annotations.SerializedName;

public class LoginRequest {
    @SerializedName("mobile_number")
    private String mobileNumber;

    @SerializedName("password")
    private String password;

    public LoginRequest(String mobileNumber, String password) {
        this.mobileNumber = mobileNumber;
        this.password = password;
    }
}
