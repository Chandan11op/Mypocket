package com.mypocket.app.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;

import com.mypocket.app.R;
import com.mypocket.app.models.AccountTransactionItem;
import com.mypocket.app.utils.FormatUtils;

import java.util.ArrayList;
import java.util.List;

public class TransactionAdapter extends RecyclerView.Adapter<TransactionAdapter.ViewHolder> {

    private final List<AccountTransactionItem> transactions = new ArrayList<>();

    public void setTransactions(List<AccountTransactionItem> newTransactions) {
        transactions.clear();
        if (newTransactions != null) {
            transactions.addAll(newTransactions);
        }
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_transaction, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        AccountTransactionItem item = transactions.get(position);

        String desc = item.getDescription();
        if (desc == null || desc.isEmpty()) {
            desc = item.getTransactionType();
        }
        holder.tvDescription.setText(desc);

        String dateStr = item.getDate() != null && item.getDate().length() >= 10 ? item.getDate().substring(0, 10) : "";
        String details = dateStr;

        if (item.getCounterAccountName() != null && !item.getCounterAccountName().isEmpty()) {
            details += " • " + item.getCounterAccountName();
        }
        if (item.getPerson() != null && !item.getPerson().isEmpty()) {
            details += " (" + item.getPerson() + ")";
        }
        holder.tvDetails.setText(details);

        double debit = item.getDebit();
        double credit = item.getCredit();

        if (debit > 0) {
            holder.tvAmount.setText("+" + FormatUtils.formatCurrency(debit));
            holder.tvAmount.setTextColor(ContextCompat.getColor(holder.itemView.getContext(), R.color.income_green));
        } else {
            holder.tvAmount.setText("-" + FormatUtils.formatCurrency(credit));
            holder.tvAmount.setTextColor(ContextCompat.getColor(holder.itemView.getContext(), R.color.expense_red));
        }
    }

    @Override
    public int getItemCount() {
        return transactions.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvDescription, tvDetails, tvAmount;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvDescription = itemView.findViewById(R.id.tv_description);
            tvDetails = itemView.findViewById(R.id.tv_details);
            tvAmount = itemView.findViewById(R.id.tv_amount);
        }
    }
}
