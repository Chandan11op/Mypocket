package com.mypocket.app.models;

import com.google.gson.annotations.SerializedName;

public class AccountTransactionItem {
    @SerializedName("_id")
    private String id;

    @SerializedName("date")
    private String date;

    @SerializedName("transaction_type")
    private String transactionType;

    @SerializedName("description")
    private String description;

    @SerializedName("debit")
    private double debit;

    @SerializedName("credit")
    private double credit;

    @SerializedName("running_balance")
    private double runningBalance;

    @SerializedName("counter_account_name")
    private String counterAccountName;

    @SerializedName("person")
    private String person;

    public String getId() {
        return id;
    }

    public String getDate() {
        return date;
    }

    public String getTransactionType() {
        return transactionType;
    }

    public String getDescription() {
        return description;
    }

    public double getDebit() {
        return debit;
    }

    public double getCredit() {
        return credit;
    }

    public double getAmount() {
        return debit > 0 ? debit : credit;
    }

    public double getRunningBalance() {
        return runningBalance;
    }

    public String getCounterAccountName() {
        return counterAccountName;
    }

    public String getPerson() {
        return person;
    }
}
