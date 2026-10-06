package com.mypocket.app.models;

import com.google.gson.annotations.SerializedName;

public class CreateAccountRequest {
    @SerializedName("name")
    private String name;

    @SerializedName("account_class")
    private String accountClass; // ASSET, LIABILITY, INCOME, EXPENSE

    @SerializedName("account_type")
    private String accountType; // CASH, BANK, WALLET, INVESTMENT, CREDIT_CARD, LOAN, RECEIVABLE

    @SerializedName("institution_name")
    private String institutionName;

    @SerializedName("opening_balance")
    private double openingBalance;

    public CreateAccountRequest(String name, String accountClass, String accountType, String institutionName, double openingBalance) {
        this.name = name;
        this.accountClass = accountClass;
        this.accountType = accountType;
        this.institutionName = institutionName;
        this.openingBalance = openingBalance;
    }
}
