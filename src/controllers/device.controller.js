const deviceService = require('../services/device.service');
const { success, error } = require('../utils/response');

/**
 * POST /device/register
 * Register device and get device token
 */
const register = async (req, res) => {
  try {
    const result = await deviceService.registerDevice(req.body);
    return success(res, result, 'Đăng ký thiết bị thành công');
  } catch (err) {
    return error(res, err.code || 'REGISTER_ERROR', err.message, err.status || 500);
  }
};

/**
 * GET /device/config
 * Get device configuration for offline mode
 */
const getConfig = async (req, res) => {
  try {
    const config = await deviceService.getDeviceConfig(req.device.id);
    return success(res, config);
  } catch (err) {
    return error(res, err.code || 'CONFIG_ERROR', err.message, err.status || 500);
  }
};

/**
 * POST /device/heartbeat
 * Device status heartbeat
 */
const heartbeat = async (req, res) => {
  try {
    const result = await deviceService.processHeartbeat(req.device.id, req.body);
    return success(res, result);
  } catch (err) {
    return error(res, err.code || 'HEARTBEAT_ERROR', err.message, err.status || 500);
  }
};

/**
 * GET /device/:deviceId (Admin)
 * Get device details
 */
const getDevice = async (req, res) => {
  try {
    const device = await deviceService.getDevice(req.params.deviceId);
    return success(res, device);
  } catch (err) {
    return error(res, err.code || 'GET_DEVICE_ERROR', err.message, err.status || 500);
  }
};

/**
 * PUT /device/:deviceId/config (Admin)
 * Update device configuration
 */
const updateConfig = async (req, res) => {
  try {
    const config = await deviceService.updateDeviceConfig(req.params.deviceId, req.body);
    return success(res, config, 'Cập nhật cấu hình thành công');
  } catch (err) {
    return error(res, err.code || 'UPDATE_CONFIG_ERROR', err.message, err.status || 500);
  }
};

/**
 * GET /devices (Admin)
 * List all devices
 */
const listDevices = async (req, res) => {
  try {
    const devices = await deviceService.listDevices();
    return success(res, devices);
  } catch (err) {
    return error(res, err.code || 'LIST_DEVICES_ERROR', err.message, err.status || 500);
  }
};

module.exports = {
  register,
  getConfig,
  heartbeat,
  getDevice,
  updateConfig,
  listDevices
};
