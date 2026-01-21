import { supabase } from './supabase';

export interface BillingData {
    billing_name?: string;
    billing_id?: string;
    billing_address?: string;
    billing_postal_code?: string;
    billing_city?: string;
}

/**
 * Generates the next invoice number using the Supabase RPC function
 * and updates the order with the invoice number and billing data.
 */
export async function generateInvoiceForOrder(orderId: string, billingData: BillingData) {
    try {
        // 1. Generate next invoice number via RPC
        const { data: invoiceNumber, error: rpcError } = await supabase.rpc('generate_next_invoice_number');

        if (rpcError) {
            console.error('Error calling generate_next_invoice_number RPC:', rpcError);
            // Fallback: simple timestamp-based number if RPC fails (migration not run yet)
            const fallbackNumber = `F${new Date().getFullYear()}-ERR-${orderId.slice(0, 4).toUpperCase()}`;

            await supabase
                .from('orders')
                .update({
                    invoice_number: fallbackNumber,
                    ...billingData
                })
                .eq('id', orderId);

            return fallbackNumber;
        }

        // 2. Update order with invoice number and billing details
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                invoice_number: invoiceNumber,
                ...billingData
            })
            .eq('id', orderId);

        if (updateError) {
            console.error('Error updating order with invoice number:', updateError);
            return null;
        }

        return invoiceNumber;
    } catch (error) {
        console.error('Unexpected error in generateInvoiceForOrder:', error);
        return null;
    }
}
