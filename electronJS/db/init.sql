-- ============================================
-- ReliableSpider 数据库初始化脚本
-- MySQL 5.7 兼容版本
-- ============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `reliableSpider` 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

USE `reliableSpider`;

-- ============================================
-- 1. 任务表 (tasks)
-- 对应实体: TaskMessage, TaskInfo
-- ============================================
CREATE TABLE `tasks` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '任务ID',
  `name` VARCHAR(255) NOT NULL COMMENT '任务名称',
  `type` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '任务类型: 1-数据采集, 2-网站监控, 3-API测试',
  `status` ENUM('waiting', 'running', 'paused', 'completed', 'failed', 'stopped') NOT NULL DEFAULT 'waiting' COMMENT '任务状态',
  `description` TEXT COMMENT '任务描述',
  `url` VARCHAR(2048) COMMENT '目标URL',
  `user_data_folder` VARCHAR(255) COMMENT '用户数据目录',
  `mysql_config_path` VARCHAR(500) COMMENT 'MySQL配置文件路径',
  `interval_seconds` INT(11) DEFAULT 3600 COMMENT '执行间隔(秒)',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `last_executed_at` TIMESTAMP NULL COMMENT '最后执行时间',
  `next_execute_at` TIMESTAMP NULL COMMENT '下次执行时间',
  PRIMARY KEY (`id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_next_execute` (`next_execute_at`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务表';

-- ============================================
-- 2. 任务执行日志表 (task_logs)
-- 记录任务执行历史
-- ============================================
CREATE TABLE `task_logs` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `task_id` INT(11) NOT NULL COMMENT '任务ID',
  `execution_id` VARCHAR(36) COMMENT '执行批次ID',
  `status` ENUM('started', 'running', 'completed', 'failed', 'paused') NOT NULL COMMENT '执行状态',
  `start_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '开始时间',
  `end_time` TIMESTAMP NULL COMMENT '结束时间',
  `duration_ms` BIGINT(20) COMMENT '执行时长(毫秒)',
  `message` TEXT COMMENT '日志消息',
  `level` ENUM('info', 'warning', 'error', 'success') NOT NULL DEFAULT 'info' COMMENT '日志级别',
  `details` JSON COMMENT '详细信息',
  PRIMARY KEY (`id`),
  INDEX `idx_task_id` (`task_id`),
  INDEX `idx_execution_id` (`execution_id`),
  INDEX `idx_start_time` (`start_time`),
  INDEX `idx_level` (`level`),
  FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务执行日志表';

-- ============================================
-- 3. 爬虫节点表 (crawler_nodes)
-- 对应实体: CrawlerNodeParameters
-- 存储爬虫流程图的节点配置
-- ============================================
CREATE TABLE `crawler_nodes` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '节点ID',
  `task_id` INT(11) NOT NULL COMMENT '所属任务ID',
  `node_index` INT(11) NOT NULL COMMENT '节点索引',
  `node_type` TINYINT(4) NOT NULL COMMENT '节点类型: 1-点击,2-输入,3-提取,4-判断,5-循环',
  `title` VARCHAR(255) COMMENT '节点标题',
  `description` TEXT COMMENT '节点描述',
  `iframe` BOOLEAN DEFAULT FALSE COMMENT '是否在iframe中',
  `xpath` VARCHAR(2000) COMMENT 'XPath表达式',
  `option` INT(11) DEFAULT 0 COMMENT '操作选项',
  `option_mode` INT(11) DEFAULT 0 COMMENT '选项模式',
  `option_value` TEXT COMMENT '选项值',
  `use_loop` BOOLEAN DEFAULT FALSE COMMENT '是否使用循环',
  `loop_index` INT(11) COMMENT '循环索引',
  `loop_type` TINYINT(4) DEFAULT 0 COMMENT '循环类型: 1-次数循环,2-条件循环',
  `value` TEXT COMMENT '节点值',
  `code` TEXT COMMENT 'JavaScript代码',
  `code_mode` INT(11) DEFAULT 0 COMMENT '代码模式',
  `wait_time` INT(11) DEFAULT 0 COMMENT '等待时间(毫秒)',
  `before_js` TEXT COMMENT '执行前JavaScript',
  `before_js_wait_time` INT(11) DEFAULT 0 COMMENT '执行前JS等待时间',
  `after_js` TEXT COMMENT '执行后JavaScript',
  `after_js_wait_time` INT(11) DEFAULT 0 COMMENT '执行后JS等待时间',
  `click_way` TINYINT(4) DEFAULT 1 COMMENT '点击方式: 1-左键,2-右键,3-双击',
  `new_tab` TINYINT(4) DEFAULT 0 COMMENT '是否新标签页',
  `alert_handle_type` TINYINT(4) DEFAULT 0 COMMENT '弹窗处理类型',
  `path_list` TEXT COMMENT '路径列表(JSON)',
  `text_list` TEXT COMMENT '文本列表(JSON)',
  `links` TEXT COMMENT '链接配置',
  `class_type` INT(11) DEFAULT 0 COMMENT '分类类型',
  `position_x` DECIMAL(10,2) DEFAULT 0 COMMENT 'X坐标',
  `position_y` DECIMAL(10,2) DEFAULT 0 COMMENT 'Y坐标',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_task_id` (`task_id`),
  INDEX `idx_node_index` (`node_index`),
  UNIQUE KEY `uk_task_node` (`task_id`, `node_index`),
  FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='爬虫节点表';

-- ============================================
-- 4. 数据提取参数表 (data_extraction_params)
-- 对应实体: DataExtractionParam
-- ============================================
CREATE TABLE `data_extraction_params` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '参数ID',
  `node_id` BIGINT(20) NOT NULL COMMENT '所属节点ID',
  `param_index` INT(11) NOT NULL COMMENT '参数索引',
  `iframe` BOOLEAN DEFAULT FALSE COMMENT '是否在iframe中',
  `relative_xpath` VARCHAR(2000) COMMENT '相对XPath',
  `relative` BOOLEAN DEFAULT FALSE COMMENT '是否相对定位',
  `content_type` TINYINT(4) NOT NULL DEFAULT 0 COMMENT '内容类型: 0-文本,1-链接,2-图片,3-属性',
  `node_type` TINYINT(4) NOT NULL DEFAULT 0 COMMENT '节点类型',
  `js_code` TEXT COMMENT 'JavaScript代码',
  `before_js` TEXT COMMENT '执行前JavaScript',
  `before_js_wait_time` INT(11) DEFAULT 0 COMMENT '执行前JS等待时间',
  `after_js` TEXT COMMENT '执行后JavaScript',
  `after_js_wait_time` INT(11) DEFAULT 0 COMMENT '执行后JS等待时间',
  `para_type` VARCHAR(50) DEFAULT 'text' COMMENT '参数类型',
  `record_as_field` BOOLEAN DEFAULT TRUE COMMENT '是否记录为字段',
  `default_value` TEXT COMMENT '默认值',
  `download_pic` BOOLEAN DEFAULT FALSE COMMENT '是否下载图片',
  `split_line` BOOLEAN DEFAULT FALSE COMMENT '是否分割行',
  `field_name` VARCHAR(255) COMMENT '字段名称',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_node_id` (`node_id`),
  INDEX `idx_param_index` (`param_index`),
  UNIQUE KEY `uk_node_param` (`node_id`, `param_index`),
  FOREIGN KEY (`node_id`) REFERENCES `crawler_nodes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据提取参数表';

-- ============================================
-- 5. 任务结果表 (task_results)
-- 存储爬虫执行的结果数据
-- ============================================
CREATE TABLE `task_results` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '结果ID',
  `task_id` INT(11) NOT NULL COMMENT '任务ID',
  `execution_id` VARCHAR(36) COMMENT '执行批次ID',
  `result_type` ENUM('text', 'url', 'image', 'file', 'json') NOT NULL DEFAULT 'text' COMMENT '结果类型',
  `field_name` VARCHAR(255) COMMENT '字段名称',
  `field_value` LONGTEXT COMMENT '字段值',
  `source_url` VARCHAR(2048) COMMENT '来源URL',
  `xpath` VARCHAR(2000) COMMENT '提取XPath',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_task_id` (`task_id`),
  INDEX `idx_execution_id` (`execution_id`),
  INDEX `idx_result_type` (`result_type`),
  INDEX `idx_created_at` (`created_at`),
  FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务结果表';

-- ============================================
-- 6. 系统配置表 (system_configs)
-- 存储系统配置参数
-- ============================================
CREATE TABLE `system_configs` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `config_key` VARCHAR(255) NOT NULL COMMENT '配置键',
  `config_value` TEXT COMMENT '配置值',
  `config_type` ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string' COMMENT '配置类型',
  `description` VARCHAR(500) COMMENT '配置描述',
  `is_system` BOOLEAN DEFAULT FALSE COMMENT '是否系统配置',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_config_key` (`config_key`),
  INDEX `idx_is_system` (`is_system`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- ============================================
-- 7. 浏览器配置表 (browser_configs)
-- 存储浏览器相关的配置
-- ============================================
CREATE TABLE `browser_configs` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `name` VARCHAR(255) NOT NULL COMMENT '配置名称',
  `user_agent` VARCHAR(500) COMMENT 'User-Agent',
  `window_width` INT(11) DEFAULT 1280 COMMENT '窗口宽度',
  `window_height` INT(11) DEFAULT 800 COMMENT '窗口高度',
  `disable_images` BOOLEAN DEFAULT FALSE COMMENT '禁用图片',
  `disable_css` BOOLEAN DEFAULT FALSE COMMENT '禁用CSS',
  `headless` BOOLEAN DEFAULT FALSE COMMENT '无头模式',
  `proxy_config` JSON COMMENT '代理配置',
  `extensions` JSON COMMENT '扩展配置',
  `custom_options` JSON COMMENT '自定义选项',
  `is_default` BOOLEAN DEFAULT FALSE COMMENT '是否默认配置',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='浏览器配置表';

-- ============================================
-- 8. WebSocket连接记录表 (websocket_connections)
-- 对应实体: SocketConnections
-- ============================================
CREATE TABLE `websocket_connections` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '连接ID',
  `connection_id` VARCHAR(36) NOT NULL COMMENT '连接唯一ID',
  `socket_type` ENUM('window', 'start', 'flowchart', 'popup') NOT NULL COMMENT 'Socket类型',
  `task_id` INT(11) COMMENT '关联任务ID',
  `client_ip` VARCHAR(45) COMMENT '客户端IP',
  `user_agent` VARCHAR(500) COMMENT 'User-Agent',
  `connect_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '连接时间',
  `last_active_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后活跃时间',
  `status` ENUM('active', 'closed', 'error') NOT NULL DEFAULT 'active' COMMENT '连接状态',
  `close_reason` VARCHAR(255) COMMENT '关闭原因',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_connection_id` (`connection_id`),
  INDEX `idx_socket_type` (`socket_type`),
  INDEX `idx_task_id` (`task_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_connect_time` (`connect_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='WebSocket连接记录表';

-- ============================================
-- 初始化基础数据
-- ============================================

-- 插入系统默认配置
INSERT INTO `system_configs` (`config_key`, `config_value`, `config_type`, `description`, `is_system`) VALUES
('websocket.port', '8080', 'number', 'WebSocket服务器端口', TRUE),
('server.port', '8074', 'number', 'HTTP服务器端口', TRUE),
('server.host', 'localhost', 'string', '服务器地址', TRUE),
('default.language', 'zh', 'string', '默认语言', TRUE),
('debug.mode', 'false', 'boolean', '调试模式', TRUE),
('max.concurrent.tasks', '5', 'number', '最大并发任务数', TRUE),
('task.timeout.seconds', '3600', 'number', '任务超时时间(秒)', TRUE),
('data.export.format', 'csv', 'string', '默认数据导出格式', FALSE),
('auto.save.interval', '100', 'number', '自动保存间隔(条记录)', FALSE);

-- 插入默认浏览器配置
INSERT INTO `browser_configs` (`name`, `user_agent`, `window_width`, `window_height`, `is_default`) VALUES
('Default Desktop', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 1280, 800, TRUE),
('Mobile Device', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1', 375, 667, FALSE),
('Tablet Device', 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1', 1024, 768, FALSE);

-- ============================================
-- 创建视图，便于查询
-- ============================================

-- 任务统计视图
CREATE VIEW `v_task_stats` AS
SELECT 
  t.id,
  t.name,
  t.status,
  t.created_at,
  t.last_executed_at,
  COUNT(tr.id) as total_runs,
  COUNT(CASE WHEN tr.status = 'completed' THEN 1 END) as success_runs,
  COUNT(CASE WHEN tr.status = 'failed' THEN 1 END) as failed_runs,
  MAX(tr.end_time) as last_run_time,
  AVG(tr.duration_ms) as avg_duration
FROM tasks t
LEFT JOIN task_logs tr ON t.id = tr.task_id
GROUP BY t.id, t.name, t.status, t.created_at, t.last_executed_at;

-- 任务结果统计视图
CREATE VIEW `v_task_result_stats` AS
SELECT 
  task_id,
  COUNT(*) as total_records,
  COUNT(CASE WHEN result_type = 'text' THEN 1 END) as text_records,
  COUNT(CASE WHEN result_type = 'url' THEN 1 END) as url_records,
  COUNT(CASE WHEN result_type = 'image' THEN 1 END) as image_records,
  COUNT(CASE WHEN result_type = 'file' THEN 1 END) as file_records,
  MIN(created_at) as first_result_time,
  MAX(created_at) as last_result_time
FROM task_results
GROUP BY task_id;

-- ============================================
-- 创建存储过程
-- ============================================

DELIMITER //

-- 清理过期日志的存储过程
CREATE PROCEDURE `cleanup_old_logs`(IN days_to_keep INT)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;
  
  START TRANSACTION;
  
  -- 删除超过指定天数的日志
  DELETE FROM task_logs 
  WHERE start_time < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
  
  -- 删除超过指定天数的结果数据
  DELETE FROM task_results 
  WHERE created_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
  
  -- 删除过期的WebSocket连接记录
  DELETE FROM websocket_connections 
  WHERE status = 'closed' AND last_active_time < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
  
  COMMIT;
END//

-- 更新任务下次执行时间的存储过程
CREATE PROCEDURE `update_next_execute_time`(IN task_id_param INT)
BEGIN
  DECLARE interval_seconds_val INT;
  DECLARE next_time_val TIMESTAMP;
  
  SELECT interval_seconds INTO interval_seconds_val 
  FROM tasks 
  WHERE id = task_id_param;
  
  IF interval_seconds_val > 0 THEN
    SET next_time_val = DATE_ADD(NOW(), INTERVAL interval_seconds_val SECOND);
    
    UPDATE tasks 
    SET next_execute_at = next_time_val,
        last_executed_at = NOW()
    WHERE id = task_id_param;
  ELSE
    UPDATE tasks 
    SET last_executed_at = NOW()
    WHERE id = task_id_param;
  END IF;
END//

DELIMITER ;

-- ============================================
-- 创建触发器
-- ============================================

-- 任务更新时记录日志的触发器
DELIMITER //
CREATE TRIGGER `tr_task_update_log` 
AFTER UPDATE ON `tasks`
FOR EACH ROW
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO task_logs (task_id, status, message, level)
    VALUES (NEW.id, NEW.status, 
            CONCAT('任务状态从 ', OLD.status, ' 变更为 ', NEW.status), 
            'info');
  END IF;
END//
DELIMITER ;

-- ============================================
-- 初始化完成提示
-- ============================================
SELECT 'ReliableSpider数据库初始化完成!' as message;
SELECT CONCAT('数据库版本: ', VERSION()) as db_version;
SELECT '表创建数量: ' AS info, COUNT(*) as count 
FROM information_schema.tables 
WHERE table_schema = 'reliableSpider';