package com.mypocket.app.network;

import com.mypocket.app.models.AccountTransactionsResponse;
import com.mypocket.app.models.AccountsListResponse;
import com.mypocket.app.models.AccountingTransactionRequest;
import com.mypocket.app.models.AiChatRequest;
import com.mypocket.app.models.AiChatResponse;
import com.mypocket.app.models.AiHistoryResponse;
import com.mypocket.app.models.AuthResponse;
import com.mypocket.app.models.CreateAccountRequest;
import com.mypocket.app.models.FinancialPositionResponse;
import com.mypocket.app.models.ForgotPasswordRequest;
import com.mypocket.app.models.GenericResponse;
import com.mypocket.app.models.LoginRequest;
import com.mypocket.app.models.PersonsListResponse;
import com.mypocket.app.models.ReconciliationRequest;
import com.mypocket.app.models.ReconciliationResponse;
import com.mypocket.app.models.RegisterRequest;
import com.mypocket.app.models.ResetPasswordRequest;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.DELETE;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.Path;
import retrofit2.http.Query;

public interface ApiService {

    // Health Check
    @GET("health")
    Call<GenericResponse> checkHealth();

    // Auth
    @POST("auth/login")
    Call<AuthResponse> login(@Body LoginRequest request);

    @POST("auth/register")
    Call<GenericResponse> register(@Body RegisterRequest request);

    @POST("auth/forgot-password")
    Call<GenericResponse> forgotPassword(@Body ForgotPasswordRequest request);

    @POST("auth/reset-password")
    Call<GenericResponse> resetPassword(@Body ResetPasswordRequest request);

    @GET("auth/me")
    Call<AuthResponse> getMe();

    @POST("auth/logout")
    Call<GenericResponse> logout();

    // Accounts
    @GET("accounts")
    Call<AccountsListResponse> getAccounts();

    @POST("accounts")
    Call<GenericResponse> createAccount(@Body CreateAccountRequest request);

    @GET("accounts/{id}/transactions")
    Call<AccountTransactionsResponse> getAccountTransactions(
            @Path("id") String accountId,
            @Query("sort_order") String sortOrder
    );

    @DELETE("accounts/{id}")
    Call<GenericResponse> deleteAccount(@Path("id") String accountId);

    // Accounting
    @POST("accounting/transactions")
    Call<GenericResponse> createAccountingTransaction(@Body AccountingTransactionRequest request);

    // Financial Position & Statements
    @GET("financial-position")
    Call<FinancialPositionResponse> getFinancialPosition();

    // Reconciliation
    @POST("reconciliation/{accountId}")
    Call<ReconciliationResponse> reconcileAccount(
            @Path("accountId") String accountId,
            @Body ReconciliationRequest request
    );

    // Persons
    @GET("persons")
    Call<PersonsListResponse> getPersons();

    @GET("persons/search")
    Call<PersonsListResponse> searchPersons(@Query("q") String query);

    // AI
    @POST("ai/chat")
    Call<AiChatResponse> chatWithAi(@Body AiChatRequest request);

    @GET("ai/history")
    Call<AiHistoryResponse> getAiHistory();
}
