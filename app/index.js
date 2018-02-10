import BigNumber from 'bignumber.js';
import abi from 'ethereumjs-abi';

import { services } from './services';
import { transactionStore } from './stores/index';

const { eacService, web3Service } = services;

async function setup() {
  try {
    if (window.web3) {
      await web3Service.init();      
    }
  } catch (error) {

  }

  const { web3 } = web3Service;

  class Utils {
    static castGweiToWei(gweiAmount) {
      if (!web3) {
        throw 'Casting Gwei to Wei failed. Web3 not present.';
      }

      return web3.toWei(gweiAmount, 'gwei');
    }

    static isWeb3Enabled() {
      return Boolean(window.web3);
    }

    static isMetaMaskEnabled() {
      return Boolean(Utils.isWeb3Enabled && window.web3.currentProvider &&
        window.web3.currentProvider.isMetaMask);
    }

    static isWalletLocked() {
      return !web3.eth.accounts[0];
    }

    static getABIEncodedParams(parameterTypes, parameterValues) {
      if (!parameterTypes) {
        throw 'Parameters types are needed for encoding ABI params.';
      }

      if (!parameterValues) {
        throw 'Parameters values are needed for encoding ABI params.';
      }

      return abi.rawEncode(parameterTypes, parameterValues);
    }
  }

  const EAC_GAS_AMOUNT = 180000;

  class Schedule {
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
    web3Enabled = false

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
      this.web3Enabled = Utils.isWeb3Enabled();

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

    get finalCallGasAmount() {
      return this.callGasAmount + EAC_GAS_AMOUNT;
    }

    get callData() {
      if (!this.callMethodSignature) {
        return null;
      }

      return this.callMethodSignature +this.ABIEncodedParams;
    }

    get ABIEncodedParams() {
      if (!this.callMethodParameterTypes) {
        return '';
      }

      return Utils.getABIEncodedParams(this.callMethodParameterTypes, this.callMethodParameterValues);
    }

    computeUIState() {
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
        false
      );

      console.log('trans', transaction);

      this.successHandler(transaction);
    }
  }

  window['Schedule'] = Schedule;
  window['ScheduleUtils'] = Utils;
}

window['ScheduleSetup'] = setup;