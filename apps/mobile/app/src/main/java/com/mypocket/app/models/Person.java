package com.mypocket.app.models;

import com.google.gson.annotations.SerializedName;

public class Person {
    @SerializedName("id")
    private String id;

    @SerializedName("_id")
    private String mongoId;

    @SerializedName("name")
    private String name;

    public String getId() {
        return id != null ? id : mongoId;
    }

    public String getName() {
        return name;
    }
}
