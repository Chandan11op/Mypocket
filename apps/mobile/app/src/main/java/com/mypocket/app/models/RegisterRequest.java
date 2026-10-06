package com.mypocket.app.models;

import com.google.gson.annotations.SerializedName;

public class RegisterRequest {
    @SerializedName("mobile_number")
    private String mobileNumber;

    @SerializedName("username")
    private String username;

    @SerializedName("email")
    private String email;

    @SerializedName("full_name")
    private String fullName;

    @SerializedName("date_of_birth")
    private String dateOfBirth;

    @SerializedName("password")
    private String password;

    public RegisterRequest(String mobileNumber, String username, String email, String fullName, String dateOfBirth, String password) {
        this.mobileNumber = mobileNumber;
        this.username = username;
        this.email = email;
        this.fullName = fullName;
        this.dateOfBirth = dateOfBirth;
        this.password = password;
    }
}
