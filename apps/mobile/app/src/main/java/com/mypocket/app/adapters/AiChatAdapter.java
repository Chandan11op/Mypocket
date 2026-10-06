package com.mypocket.app.adapters;

import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;

import com.mypocket.app.R;
import com.mypocket.app.models.AiHistoryResponse;

import java.util.ArrayList;
import java.util.List;

public class AiChatAdapter extends RecyclerView.Adapter<AiChatAdapter.ViewHolder> {

    private final List<AiHistoryResponse.ChatItem> messages = new ArrayList<>();

    public void setMessages(List<AiHistoryResponse.ChatItem> newMessages) {
        messages.clear();
        if (newMessages != null) {
            messages.addAll(newMessages);
        }
        notifyDataSetChanged();
    }

    public void addMessage(AiHistoryResponse.ChatItem message) {
        messages.add(message);
        notifyItemInserted(messages.size() - 1);
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_ai_message, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        AiHistoryResponse.ChatItem item = messages.get(position);
        holder.tvMessage.setText(item.getMessage());

        boolean isUser = "user".equalsIgnoreCase(item.getRole());
        LinearLayout.LayoutParams params = (LinearLayout.LayoutParams) holder.tvMessage.getLayoutParams();

        if (isUser) {
            holder.layoutBubble.setGravity(Gravity.END);
            holder.tvMessage.setBackgroundResource(R.drawable.bg_spinner);
            holder.tvMessage.setTextColor(ContextCompat.getColor(holder.itemView.getContext(), R.color.slate_800));
        } else {
            holder.layoutBubble.setGravity(Gravity.START);
            holder.tvMessage.setBackgroundColor(ContextCompat.getColor(holder.itemView.getContext(), R.color.accent_bg));
            holder.tvMessage.setTextColor(ContextCompat.getColor(holder.itemView.getContext(), R.color.primary_dark));
        }
    }

    @Override
    public int getItemCount() {
        return messages.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        LinearLayout layoutBubble;
        TextView tvMessage;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            layoutBubble = itemView.findViewById(R.id.layout_bubble);
            tvMessage = itemView.findViewById(R.id.tv_message);
        }
    }
}
