import { Utils } from './utils';
import { stores } from '../stores/index';

const { transactionStore } = stores;

const EAC_GAS_AMOUNT = 180000;

export class Schedule {
    enabledInfoSelector
    disabledInfoSelector
    sendButtonSelector

    windowStart
    windowSize
    toAddress
    fee
    payment
    requiredDeposit

    callValue
    callGasPrice
    callGasAmount
    callMethodSignature
    callMethodParameterTypes
    callMethodParameterValues

    successHandler

    constructor({
        enabledInfoSelector,
        disabledInfoSelector,
        lockedInfoSelector,
        sendButtonSelector,
        windowStart,
        windowSize,
        toAddress,
        fee = 0,
        payment = 0,
        requiredDeposit = 0,
        callValue = 0,
        callGasPrice,
        callGasAmount = 0,
        callMethodSignature,
        callMethodParameterTypes,
        callMethodParameterValues,
        successHandler = () => {}
    }) {
        this.enabledInfoSelector = enabledInfoSelector;
        this.disabledInfoSelector = disabledInfoSelector;
        this.sendButtonSelector = sendButtonSelector;
        this.lockedInfoSelector = lockedInfoSelector;

        this.computeUIState();

        if (!this.web3Enabled) {
            return;
        }

        this.windowStart = windowStart;
        this.windowSize = windowSize;
        this.toAddress = toAddress;

        this.fee = fee;
        this.payment = payment;
        this.requiredDeposit = requiredDeposit;

        this.callValue = callValue;
        this.callGasPrice = callGasPrice || Utils.castGweiToWei(50);
        this.callGasAmount = callGasAmount;
        this.callMethodSignature = callMethodSignature;
        this.callMethodParameterTypes = callMethodParameterTypes;
        this.callMethodParameterValues = callMethodParameterValues;

        this.successHandler = successHandler;

        this.sendTransaction = this.sendTransaction.bind(this);
        this.attachSendClickHandler();
    }

    get web3Enabled() {
        return Utils.isWeb3Enabled();
    }

    get finalCallGasAmount() {
        return this.callGasAmount + EAC_GAS_AMOUNT;
    }

    get callData() {
        if (!this.callMethodSignature) {
            return null;
        }

        return this.callMethodSignature + this.ABIEncodedParams;
    }

    get ABIEncodedParams() {
        if (!this.callMethodParameterTypes) {
            return '';
        }

        return Utils.getABIEncodedParams(this.callMethodParameterTypes, this.callMethodParameterValues);
    }

    computeUIState() {
        if (typeof(window) === 'undefined') {
            return;
        }

        const $sendButton = $(this.sendButtonSelector);
        const $disabledInfo = $(this.disabledInfoSelector);
        const $enabledInfo = $(this.enabledInfoSelector);
        const $lockedInfo = $(this.lockedInfoSelector);

        let checkAgain = true;

        if (this.web3Enabled) {
            if (Utils.isWalletLocked()) {
                $sendButton.attr('disabled', true);
                $lockedInfo.show();
                $enabledInfo.hide();
            } else {
                $sendButton.attr('disabled', null);
                $lockedInfo.hide();
                $enabledInfo.show();
            }

            $disabledInfo.hide();
        } else {
            $sendButton.attr('disabled', true);
            $lockedInfo.hide();
            $disabledInfo.show();

            checkAgain = false;
        }

        if (checkAgain) {
            setTimeout(() => this.computeUIState(), 1000);
        }
    }

    attachSendClickHandler() {
        const $sendButton = $(this.sendButtonSelector);

        $sendButton.click(this.sendTransaction);
    }

    async sendTransaction() {
        const initialGasPrice = await Utils.getRecommendedGasPrice();

        const transaction = await transactionStore.schedule(
            this.toAddress,
            this.callData,
            this.finalCallGasAmount,
            this.callValue,
            this.windowSize,
            this.windowStart,
            this.callGasPrice,
            this.fee,
            this.payment,
            this.requiredDeposit,
            false,
            initialGasPrice
        );

        this.successHandler(transaction);
    }
}