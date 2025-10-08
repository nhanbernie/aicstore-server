export interface PayosWebhookBodyPayload {
  code: string;
  desc: string;
  success: boolean;

  data: {
    accountNumber: string;
    amount: number;
    description: string;
    reference: string;
    transactionDateTime: string;
    virtualAccountNumber: string;
    counterAccountBankId: string;
    counterAccountBankName: string;
    counterAccountName: string;
    counterAccountNumber: string;
    virtualAccountName: string;
    currency: string;
    orderCode: number | string;
    paymentLinkId: string;
    code: string;
    desc: string;
  };

  signature: string;
}
