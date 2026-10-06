package com.mypocket.app.models;

import com.google.gson.annotations.SerializedName;

public class AccountingTransactionRequest {
    @SerializedName("transaction_type")
    private String transactionType; // EXPENSE, INCOME, TRANSFER, INVESTMENT, BORROW, REPAYMENT, LEND, RECEIVABLE_PAYMENT

    @SerializedName("amount")
    private double amount;

    @SerializedName("date")
    private String date;

    @SerializedName("description")
    private String description;

    @SerializedName("from_account_id")
    private String fromAccountId;

    @SerializedName("to_account_id")
    private String toAccountId;

    @SerializedName("income_account_id")
    private String incomeAccountId;

    @SerializedName("expense_account_id")
    private String expenseAccountId;

    @SerializedName("investment_account_id")
    private String investmentAccountId;

    @SerializedName("liability_account_id")
    private String liabilityAccountId;

    @SerializedName("receivable_account_id")
    private String receivableAccountId;

    @SerializedName("person_name")
    private String personName;

    @SerializedName("person_id")
    private String personId;

    public void setTransactionType(String transactionType) {
        this.transactionType = transactionType;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setFromAccountId(String fromAccountId) {
        this.fromAccountId = fromAccountId;
    }

    public void setToAccountId(String toAccountId) {
        this.toAccountId = toAccountId;
    }

    public void setIncomeAccountId(String incomeAccountId) {
        this.incomeAccountId = incomeAccountId;
    }

    public void setExpenseAccountId(String expenseAccountId) {
        this.expenseAccountId = expenseAccountId;
    }

    public void setInvestmentAccountId(String investmentAccountId) {
        this.investmentAccountId = investmentAccountId;
    }

    public void setLiabilityAccountId(String liabilityAccountId) {
        this.liabilityAccountId = liabilityAccountId;
    }

    public void setReceivableAccountId(String receivableAccountId) {
        this.receivableAccountId = receivableAccountId;
    }

    public void setPersonName(String personName) {
        this.personName = personName;
    }

    public void setPersonId(String personId) {
        this.personId = personId;
    }
}
