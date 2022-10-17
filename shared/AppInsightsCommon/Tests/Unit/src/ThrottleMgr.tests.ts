import { Assert, AITestClass } from "@microsoft/ai-test-framework";
import { AppInsightsCore, IAppInsightsCore, _eInternalMessageId } from "@microsoft/applicationinsights-core-js";
import { IThrottleMsgKey } from "../../../src/Enums";
import { IThrottleInterval, IThrottleLimit, IthrottleMgrConfig, IthrottleResult } from "../../../src/Interfaces/IThrottleMgr";
import { ThrottleMgr} from "../../../src/ThrottleMgr";
import { SinonSpy } from "sinon";
import { Util } from "../../../src/Util";

export class ThrottleMgrTest extends AITestClass {
    private _core: IAppInsightsCore;
    private _msgKey: IThrottleMsgKey;
    private _storageName: string;
    private _msgId: _eInternalMessageId;
    private loggingSpy: SinonSpy;

    public testInitialize() {
        this._core = new AppInsightsCore();
        this._msgKey = IThrottleMsgKey.ikeyDeprecate;
        this._storageName = "appInsightsThrottle-" + this._msgKey;
        this.loggingSpy = this.sandbox.stub(this._core.logger, "throwInternal");
        this._msgId =  _eInternalMessageId.InstrumentationKeyDeprecation;

        if (Util.canUseLocalStorage()) {
            window.localStorage.clear();
        }
    }

    public testCleanup() {
        if (Util.canUseLocalStorage()) {
            window.localStorage.clear();
        }
    }

    public registerTests() {

        this.testCase({
            name: "ThrottleMgrTest: Throttle Manager can get expected config",
            test: () => {
                let config = {
                    msgKey: this._msgKey,
                    disabled: false,
                    limit: {
                        samplingPercentage: 50,
                        maxSendNumber: 100
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 2,
                        dayInterval: 10,
                        maxTimesPerMonth: 1
                    } as IThrottleInterval
                } as IthrottleMgrConfig;

                let throttleMgr = new ThrottleMgr(config, this._core);
                let actualConfig = throttleMgr.getConfig();
                Assert.deepEqual(config, actualConfig);

                let isTriggered = throttleMgr.isTriggered();
                Assert.equal(isTriggered, false);
            }
        });

        this.testCase({
            name: "ThrottleMgrTest: Throttle Manager can get default config",
            test: () => {
                let config = {
                    msgKey: this._msgKey
                } as IthrottleMgrConfig;

                let expectedConfig = {
                    msgKey: this._msgKey,
                    disabled: false,
                    limit: {
                        samplingPercentage: 100,
                        maxSendNumber:1
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 3,
                        dayInterval: 28,
                        maxTimesPerMonth: 1
                    } as IThrottleInterval
                } as IthrottleMgrConfig;

                let throttleMgr = new ThrottleMgr(config, this._core);
                let actualConfig = throttleMgr.getConfig();
                Assert.deepEqual(expectedConfig, actualConfig);

                let isTriggered = throttleMgr.isTriggered();
                Assert.equal(isTriggered, false);
            }
        });

        this.testCase({
            name: "ThrottleMgrTest: should not trigger throttle when disabled is true",
            test: () => {
                let config = {
                    msgKey: this._msgKey,
                    disabled: true
                } as IthrottleMgrConfig;
                let throttleMgr = new ThrottleMgr(config, this._core);
                let canThrottle = throttleMgr.canThrottle();
                Assert.equal(canThrottle, false);

                let isTriggered = throttleMgr.isTriggered();
                Assert.equal(isTriggered, false);
            }
        });

        this.testCase({
            name: "ThrottleMgrTest: should not trigger throttle when month interval requirements are not meet",
            test: () => {
                let date = new Date();
                let month = date.getUTCMonth();
                let year = date.getUTCFullYear();
                if (month == 0) {
                    year -= 1;
                    month = 12;
                }
                let testStorageVal = year + "-" + month +"-" + date.getUTCDate() + ".0.0";
                window.localStorage[this._storageName] = testStorageVal;

                let config = {
                    msgKey: this._msgKey,
                    disabled: false,
                    limit: {
                        samplingPercentage: 50,
                        maxSendNumber: 100
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 3,
                        dayInterval: 1,
                        maxTimesPerMonth: 100
                    } as IThrottleInterval
                } as IthrottleMgrConfig;

                let throttleMgr = new ThrottleMgr(config, this._core);
                let canThrottle = throttleMgr.canThrottle();
                Assert.equal(canThrottle, false);

                let isTriggered = throttleMgr.isTriggered();
                Assert.equal(isTriggered, false);
            }

        });

        this.testCase({
            name: "ThrottleMgrTest: should not trigger throttle when year and month interval requirements are not meet",
            test: () => {
                let date = new Date();
                let testStorageVal = (date.getUTCFullYear() - 1) + "-" + date.getUTCMonth() +"-" + date.getUTCDate() + ".0.0";
                window.localStorage[this._storageName] = testStorageVal;

                let config = {
                    msgKey: this._msgKey,
                    disabled: false,
                    limit: {
                        samplingPercentage: 50,
                        maxSendNumber: 100
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 3,
                        dayInterval: 1,
                        maxTimesPerMonth: 100
                    } as IThrottleInterval
                } as IthrottleMgrConfig;

                let throttleMgr = new ThrottleMgr(config, this._core);
                let canThrottle = throttleMgr.canThrottle();
                Assert.equal(canThrottle, false);

                let isTriggered = throttleMgr.isTriggered();
                Assert.equal(isTriggered, false);
            }

        });

        this.testCase({
            name: "ThrottleMgrTest: should not trigger throttle when day interval requirements are not meet",
            test: () => {
                let date = new Date();
                let testStorageVal = date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) + "-" + (date.getUTCDate() - 1) + ".0.0";
                window.localStorage[this._storageName] = testStorageVal;

                let config = {
                    msgKey: this._msgKey,
                    disabled: false,
                    limit: {
                        samplingPercentage: 50,
                        maxSendNumber: 100
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 1,
                        dayInterval: 31,
                        maxTimesPerMonth: 100
                    } as IThrottleInterval
                } as IthrottleMgrConfig;

                let throttleMgr = new ThrottleMgr(config, this._core);
                let canThrottle = throttleMgr.canThrottle();
                Assert.equal(canThrottle, false);

                let isTriggered = throttleMgr.isTriggered();
                Assert.equal(isTriggered, false);
            }

        });

        this.testCase({
            name: "ThrottleMgrTest: should trigger throttle at start month",
            test: () => {
                let date = new Date();
                let testStorageVal = date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) + "-3.0.0";
                window.localStorage[this._storageName] = testStorageVal;
                let range = 1;

                let day = date.getUTCDate();
                if (day % 3 == 0) {
                    range = 3
                } else if (day % 2 == 0) {
                    range = 2
                }

                let config = {
                    msgKey: this._msgKey,
                    disabled: false,
                    limit: {
                        samplingPercentage: 50,
                        maxSendNumber: 100
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 3,
                        dayInterval: range,
                        maxTimesPerMonth: 100
                    } as IThrottleInterval
                } as IthrottleMgrConfig;

                let throttleMgr = new ThrottleMgr(config, this._core);
                let canThrottle = throttleMgr.canThrottle();
                Assert.equal(canThrottle, true);

                let isTriggered = throttleMgr.isTriggered();
                Assert.equal(isTriggered, false);
            }

        });

        this.testCase({
            name: "ThrottleMgrTest: should trigger throttle when month and day intervals are meet",
            test: () => {
                let date = new Date();
                let month = date.getUTCMonth();
                let year = date.getUTCFullYear() -2;
                let day = date.getUTCDate();
                if (month == 0) {
                    year -= 1;
                    month = 12;
                }
                let testStorageVal = year + "-" + month + "-" + day + ".0.0";
                window.localStorage[this._storageName] = testStorageVal;

                let config = {
                    msgKey: this._msgKey,
                    disabled: false,
                    limit: {
                        samplingPercentage: 50,
                        maxSendNumber: 100
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 5,
                        dayInterval: 1,
                        maxTimesPerMonth: 100
                    } as IThrottleInterval
                } as IthrottleMgrConfig;

                let throttleMgr = new ThrottleMgr(config, this._core);
                let canThrottle = throttleMgr.canThrottle();
                Assert.equal(canThrottle, true);

                let isTriggered = throttleMgr.isTriggered();
                Assert.equal(isTriggered, false);
            }

        });

        this.testCase({
            name: "ThrottleMgrTest: should trigger throttle when maxSentTimes is not meet",
            test: () => {
                let date = new Date();
                let day = date.getUTCDate();
                let testStorageVal = date.getUTCFullYear() + "-" + date.getUTCMonth() +"-" + day + ".0.0";
                window.localStorage[this._storageName] = testStorageVal;
                let maxTimes = day-1;
                let config = {
                    msgKey: this._msgKey,
                    disabled: false,
                    limit: {
                        samplingPercentage: 50,
                        maxSendNumber: 100
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 1,
                        dayInterval: 1,
                        maxTimesPerMonth: maxTimes
                    } as IThrottleInterval
                } as IthrottleMgrConfig;

                let throttleMgr = new ThrottleMgr(config, this._core);
                let canThrottle = throttleMgr.canThrottle();
                Assert.equal(canThrottle, false);

                let isTriggered = throttleMgr.isTriggered();
                Assert.equal(isTriggered, false);
            }

        });

        this.testCase({
            name: "ThrottleMgrTest: should not trigger throttle when _isTrigger state is true (in valid send message date)",
            test: () => {
                let date = new Date();
                let day = date.getUTCDate();
                let testStorageVal = date.getUTCFullYear() + "-" + date.getUTCMonth() +"-" + day + ".0.1";
                window.localStorage[this._storageName] = testStorageVal;
                let config = {
                    msgKey: this._msgKey,
                    disabled: false,
                    limit: {
                        samplingPercentage: 1000,
                        maxSendNumber: 100
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 1,
                        dayInterval: 1,
                        maxTimesPerMonth: 33
                    } as IThrottleInterval
                } as IthrottleMgrConfig;

                let throttleMgr = new ThrottleMgr(config, this._core);
                let canThrottle = throttleMgr.canThrottle();
                Assert.equal(canThrottle, true);
                let isTriggered = throttleMgr.isTriggered();
                Assert.ok(isTriggered);
            }

        });

        this.testCase({
            name: "ThrottleMgrTest: should update local storage (in non-valid send message date)",
            test: () => {
                let date = new Date();
                let day = date.getUTCDate();
                let preStorageVal = date.getUTCFullYear() + "-" + date.getUTCMonth() +"-" + day + ".0.1";
                let postStorageVal = date.getUTCFullYear() + "-" + date.getUTCMonth() +"-" + day + ".1.0";
                let msg = "Instrumentation key support will end soon, see aka.ms/IkeyMigrate";
                window.localStorage[this._storageName] = preStorageVal;
                let config = {
                    msgKey: this._msgKey,
                    disabled: false,
                    limit: {
                        samplingPercentage: 1000,
                        maxSendNumber: 1
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 1,
                        dayInterval: 1,
                        maxTimesPerMonth: 0
                    } as IThrottleInterval
                } as IthrottleMgrConfig;

                let throttleMgr = new ThrottleMgr(config, this._core);
                let canThrottle = throttleMgr.canThrottle();
                Assert.equal(canThrottle, false);
                let isPretriggered = throttleMgr.isTriggered();
                Assert.equal(isPretriggered, true);

                throttleMgr.onReadyState(true);
                let result = throttleMgr.sendMessage(this._msgId, msg);
                let expectedRetryRlt = {
                    isThrottled: false,
                    throttleNum: 0
                } as IthrottleResult
                Assert.deepEqual(result, expectedRetryRlt);
                let isPostTriggered = throttleMgr.isTriggered();
                Assert.equal(isPostTriggered, false);

                let afterTriggered = window.localStorage[this._storageName];
                Assert.equal(afterTriggered, postStorageVal);
            }

        });

        this.testCase({
            name: "ThrottleMgrTest: should not trigger sendmessage when isready state is not set",
            test: () => {
                let date = new Date();
                let testStorageVal = date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) + "-" + date.getUTCDate() + ".0.0";
                let testPostStorageVal = date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) + "-" + date.getUTCDate() + ".0.1";
                let testAfterSendStorageVal = date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) + "-" + date.getUTCDate() + ".1.1";
                let msg = "Instrumentation key support will end soon, see aka.ms/IkeyMigrate";

                let config = {
                    msgKey: IThrottleMsgKey.ikeyDeprecate,
                    disabled: false,
                    limit: {
                        samplingPercentage: 1000,
                        maxSendNumber:1
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 1,
                        dayInterval: 1,
                        maxTimesPerMonth: 100
                    } as IThrottleInterval
                } as IthrottleMgrConfig;

                let throttleMgr = new ThrottleMgr(config, this._core);

                let canThrottle = throttleMgr.canThrottle();
                Assert.ok(canThrottle);
                let isTriggeredPre = throttleMgr.isTriggered();
                Assert.equal(isTriggeredPre, false);
                let initialVal = window.localStorage[this._storageName];
                Assert.equal(initialVal,testStorageVal);

                let result = throttleMgr.sendMessage(this._msgId, msg);
                let count = this.loggingSpy.callCount;
                Assert.equal(count,0);
                Assert.deepEqual(result, null);
                let isTriggeredPost = throttleMgr.isTriggered();
                Assert.equal(isTriggeredPost, false);
                let postVal = window.localStorage[this._storageName];
                Assert.equal(postVal,testStorageVal);

                let isFlushed = throttleMgr.onReadyState(true);
                Assert.ok(isFlushed);
                let postOnReadyVal = window.localStorage[this._storageName];
                Assert.equal(postOnReadyVal,testPostStorageVal);

                let onReadyResult = throttleMgr.sendMessage(this._msgId, msg);
                let onReadyCount = this.loggingSpy.callCount;
                let expectedRlt = {
                    isThrottled: false,
                    throttleNum: 0
                } as IthrottleResult
                Assert.equal(onReadyCount,1);
                Assert.deepEqual(onReadyResult, expectedRlt);
                let onReadyIsTriggered = throttleMgr.isTriggered();
                Assert.equal(onReadyIsTriggered, true);
                let afterResendVal = window.localStorage[this._storageName];
                Assert.equal(afterResendVal, testAfterSendStorageVal);
            }
        });


        this.testCase({
            name: "ThrottleMgrTest: throw messages with correct number",
            test: () => {
                let date = new Date();
                let testStorageVal = date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) + "-" + date.getUTCDate() + ".0.1";
                let msg = "Instrumentation key support will end soon, see aka.ms/IkeyMigrate";

                let config = {
                    msgKey: IThrottleMsgKey.ikeyDeprecate,
                    disabled: false,
                    limit: {
                        samplingPercentage: 1000,
                        maxSendNumber:1
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 1,
                        dayInterval: 1,
                        maxTimesPerMonth: 100
                    } as IThrottleInterval
                } as IthrottleMgrConfig;

                let throttleMgr = new ThrottleMgr(config, this._core);

                let canThrottle = throttleMgr.canThrottle();
                Assert.ok(canThrottle);

                let isTriggeredPre = throttleMgr.isTriggered();
                Assert.equal(isTriggeredPre, false);

                throttleMgr.onReadyState(true);

                let result = throttleMgr.sendMessage(this._msgId, msg);
                let count = this.loggingSpy.callCount
                Assert.equal(count,1);
                let expectedRlt = {
                    isThrottled: true,
                    throttleNum: 1
                } as IthrottleResult
                Assert.deepEqual(result, expectedRlt);
            
                let val = window.localStorage[this._storageName];
                Assert.equal(val, testStorageVal);

                let isTriggeredPost = throttleMgr.isTriggered();
                Assert.equal(isTriggeredPost, true);
            }
        });

        this.testCase({
            name: "ThrottleMgrTest: should throw messages 1 time within a day",
            test: () => {
                let date = new Date();
                let testStorageVal = date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) + "-" + date.getUTCDate() + ".0.1";
                let testStorageRetryVal = date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) + "-" + date.getUTCDate() + ".1.1";
                let msg = "Instrumentation key support will end soon, see aka.ms/IkeyMigrate";

                let config = {
                    msgKey: IThrottleMsgKey.ikeyDeprecate,
                    disabled: false,
                    limit: {
                        samplingPercentage: 1000,
                        maxSendNumber:1
                    } as IThrottleLimit,
                    interval: {
                        monthInterval: 1,
                        dayInterval: 1,
                        maxTimesPerMonth: 100
                    } as IThrottleInterval
                } as IthrottleMgrConfig;

                let throttleMgr = new ThrottleMgr(config, this._core);

                let canThrottle = throttleMgr.canThrottle();
                Assert.ok(canThrottle);

                let isTriggeredPre = throttleMgr.isTriggered();
                Assert.equal(isTriggeredPre, false);

                throttleMgr.onReadyState(true);

                let result = throttleMgr.sendMessage(this._msgId, msg);
                let count = this.loggingSpy.callCount
                Assert.equal(count,1);
                let expectedRlt = {
                    isThrottled: true,
                    throttleNum: 1
                } as IthrottleResult
                Assert.deepEqual(result, expectedRlt);
            
                let val = window.localStorage[this._storageName];
                Assert.equal(val,testStorageVal);

                let isTriggeredPost = throttleMgr.isTriggered();
                Assert.equal(isTriggeredPost, true);
                let canThrottlePost = throttleMgr.canThrottle();
                Assert.equal(canThrottlePost, true);

                let retryRlt = throttleMgr.sendMessage(this._msgId, msg);
                let retryCount = this.loggingSpy.callCount
                Assert.equal(retryCount,1);
                let expectedRetryRlt = {
                    isThrottled: false,
                    throttleNum: 0
                } as IthrottleResult
                Assert.deepEqual(retryRlt, expectedRetryRlt);
            
                let retryVal = window.localStorage[this._storageName];
                Assert.equal(retryVal, testStorageRetryVal);
            }
        });
    }
}