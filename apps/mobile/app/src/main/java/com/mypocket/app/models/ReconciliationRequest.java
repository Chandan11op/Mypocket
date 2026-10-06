package com.mypocket.app.models;

import com.google.gson.annotations.SerializedName;

public class ReconciliationRequest {
    @SerializedName("actual_balance")
    private double actualBalance;

    @SerializedName("notes")
    private String notes;

    public ReconciliationRequest(double actualBalance, String notes) {
        this.actualBalance = actualBalance;
        this.notes = notes;
    }
}
