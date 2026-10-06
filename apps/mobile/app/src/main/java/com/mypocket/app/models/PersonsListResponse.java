package com.mypocket.app.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class PersonsListResponse {
    @SerializedName("success")
    private boolean success;

    @SerializedName("data")
    private Data data;

    public boolean isSuccess() {
        return success;
    }

    public List<Person> getPersons() {
        return data != null ? data.persons : null;
    }

    public static class Data {
        @SerializedName("persons")
        private List<Person> persons;
    }
}
