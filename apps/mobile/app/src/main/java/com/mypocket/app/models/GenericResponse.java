package com.mypocket.app.models;

import com.google.gson.annotations.SerializedName;

public class GenericResponse {
    @SerializedName("success")
    private boolean success;

    @SerializedName("message")
    private String message;

    @SerializedName("field")
    private String field;

    public boolean isSuccess() {
        return success;
    }

    public String getMessage() {
        return message;
    }

    public String getField() {
        return field;
    }
}
