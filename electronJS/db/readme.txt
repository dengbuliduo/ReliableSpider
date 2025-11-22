# ReliableSpider 数据库表结构与实体映射文档

## 数据库配置
- **数据库类型**: MySQL 5.7+
- **字符集**: utf8mb4
- **排序规则**: utf8mb4_unicode_ci
- **数据库名**: reliableSpider

## 表结构设计

### 1. 任务表 (tasks)
**对应实体**: 
- TypeScript: `Task` (src/views/TaskList.vue, TaskInfo.vue, NewTask.vue)
- 接口: `TaskMessage`, `TaskActionMessage` (src/types/app.ts)

**字段映射**:
| 数据库字段 | TypeScript字段 | 类型 | 说明 |
|-----------|---------------|------|------|
| id | id | number | 任务ID (主键) |
| name | name | string | 任务名称 |
| type | type | string | 任务类型 (1-数据采集, 2-网站监控, 3-API测试) |
| status | status | string | 任务状态 |
| description | description | string | 任务描述 |
| url | url | string | 目标URL |
| user_data_folder | user_data_folder | string | 用户数据目录 |
| mysql_config_path | mysql_config_path | string | MySQL配置路径 |
| interval_seconds | interval | number | 执行间隔(秒) |
| created_at | createdAt | string | 创建时间 |
| updated_at | - | - | 更新时间 (内部字段) |
| last_executed_at | lastExecuted | string | 最后执行时间 |
| next_execute_at | - | - | 下次执行时间 (内部字段) |

### 2. 任务执行日志表 (task_logs)
**对应实体**: 
- TypeScript: `Log` (src/views/ExecuteTask.vue)
- 服务: TaskService 中的日志记录

**字段映射**:
| 数据库字段 | TypeScript字段 | 类型 | 说明 |
|-----------|---------------|------|------|
| id | - | - | 日志ID (主键) |
| task_id | - | - | 关联任务ID |
| execution_id | - | - | 执行批次ID |
| status | - | - | 执行状态 |
| start_time | - | - | 开始时间 |
| end_time | - | - | 结束时间 |
| duration_ms | - | - | 执行时长(毫秒) |
| message | message | string | 日志消息 |
| level | level | string | 日志级别 |
| details | - | - | 详细信息(JSON) |

### 3. 爬虫节点表 (crawler_nodes)
**对应实体**: 
- TypeScript: `CrawlerNodeParameters` (src/types/app.ts)
- 消息: TaskMessage 中的节点参数

**字段映射**:
| 数据库字段 | TypeScript字段 | 类型 | 说明 |
|-----------|---------------|------|------|
| id | - | - | 节点ID (主键) |
| task_id | - | - | 所属任务ID |
| node_index | index | number | 节点索引 |
| node_type | type | number | 节点类型 |
| title | title | string | 节点标题 |
| description | - | - | 节点描述 |
| iframe | iframe | boolean | 是否在iframe中 |
| xpath | xpath | string | XPath表达式 |
| option | option | number | 操作选项 |
| option_mode | optionMode | number | 选项模式 |
| option_value | optionValue | string | 选项值 |
| use_loop | useLoop | boolean | 是否使用循环 |
| loop_index | index | number | 循环索引 |
| loop_type | loopType | number | 循环类型 |
| value | value | string | 节点值 |
| code | code | string | JavaScript代码 |
| code_mode | codeMode | number | 代码模式 |
| wait_time | waitTime | number | 等待时间(毫秒) |
| before_js | beforeJS | string | 执行前JavaScript |
| before_js_wait_time | beforeJSWaitTime | number | 执行前JS等待时间 |
| after_js | afterJS | string | 执行后JavaScript |
| after_js_wait_time | afterJSWaitTime | number | 执行后JS等待时间 |
| click_way | clickWay | number | 点击方式 |
| new_tab | newTab | number | 是否新标签页 |
| alert_handle_type | alertHandleType | number | 弹窗处理类型 |
| path_list | pathList | string | 路径列表(JSON) |
| text_list | textList | string | 文本列表(JSON) |
| links | links | string | 链接配置 |
| class_type | class | number | 分类类型 |
| position_x | - | - | X坐标 (流程图位置) |
| position_y | - | - | Y坐标 (流程图位置) |

### 4. 数据提取参数表 (data_extraction_params)
**对应实体**: 
- TypeScript: `DataExtractionParam` (src/types/app.ts)

**字段映射**:
| 数据库字段 | TypeScript字段 | 类型 | 说明 |
|-----------|---------------|------|------|
| id | - | - | 参数ID (主键) |
| node_id | - | - | 所属节点ID |
| param_index | - | - | 参数索引 |
| iframe | iframe | boolean | 是否在iframe中 |
| relative_xpath | relativeXPath | string | 相对XPath |
| relative | relative | boolean | 是否相对定位 |
| content_type | contentType | number | 内容类型 |
| node_type | nodeType | number | 节点类型 |
| js_code | JS | string | JavaScript代码 |
| before_js | beforeJS | string | 执行前JavaScript |
| before_js_wait_time | beforeJSWaitTime | number | 执行前JS等待时间 |
| after_js | afterJS | string | 执行后JavaScript |
| after_js_wait_time | afterJSWaitTime | number | 执行后JS等待时间 |
| para_type | paraType | string | 参数类型 |
| record_as_field | recordASField | boolean | 是否记录为字段 |
| default_value | default | string | 默认值 |
| download_pic | downloadPic | boolean | 是否下载图片 |
| split_line | splitLine | boolean | 是否分割行 |
| field_name | - | - | 字段名称 |

### 5. 任务结果表 (task_results)
**对应实体**: 
- TypeScript: 采集结果数据 (TaskService 处理结果)

**字段映射**:
| 数据库字段 | 说明 |
|-----------|------|
| id | 结果ID (主键) |
| task_id | 关联任务ID |
| execution_id | 执行批次ID |
| result_type | 结果类型 (text/url/image/file/json) |
| field_name | 字段名称 |
| field_value | 字段值 (LONGTEXT支持大文本) |
| source_url | 来源URL |
| xpath | 提取XPath |
| created_at | 创建时间 |

### 6. 系统配置表 (system_configs)
**对应实体**: 
- TypeScript: `AppConfig`, `ServerConfig` (src/types/app.ts)
- 配置: `APP_CONFIG` (src/config/app.config.ts)

**字段映射**:
| 数据库字段 | TypeScript配置 | 示例值 | 说明 |
|-----------|---------------|----------|------|
| config_key | APP_CONFIG.WEBSOCKET_PORT | 'websocket.port' | WebSocket端口 |
| config_value | 8080 | '8080' | 端口值 |
| config_type | 'number' | 'number' | 配置类型 |
| description | - | 'WebSocket服务器端口' | 配置说明 |
| is_system | - | TRUE | 是否系统配置 |

### 7. 浏览器配置表 (browser_configs)
**对应实体**: 
- TypeScript: `DriverOptions`, `NavigationOptions` (src/types/selenium.ts)
- 服务: SeleniumService 配置

**字段映射**:
| 数据库字段 | TypeScript字段 | 说明 |
|-----------|---------------|------|
| name | - | 配置名称 |
| user_agent | - | User-Agent字符串 |
| window_width | - | 窗口宽度 |
| window_height | - | 窗口高度 |
| disable_images | - | 禁用图片 |
| disable_css | - | 禁用CSS |
| headless | - | 无头模式 |
| proxy_config | - | 代理配置(JSON) |
| extensions | - | 扩展配置(JSON) |
| custom_options | - | 自定义选项(JSON) |
| is_default | - | 是否默认配置 |

### 8. WebSocket连接记录表 (websocket_connections)
**对应实体**: 
- TypeScript: `SocketConnections` (src/types/app.ts)
- 服务: WebSocketService 连接管理

**字段映射**:
| 数据库字段 | TypeScript字段 | 说明 |
|-----------|---------------|------|
| id | - | 连接ID (主键) |
| connection_id | - | 连接唯一ID |
| socket_type | SocketConnections.* | 连接类型 (window/start/flowchart/popup) |
| task_id | - | 关联任务ID |
| client_ip | - | 客户端IP |
| user_agent | - | User-Agent |
| connect_time | - | 连接时间 |
| last_active_time | - | 最后活跃时间 |
| status | - | 连接状态 |
| close_reason | - | 关闭原因 |

## 核心服务映射

### TaskService (src/services/task.service.ts)
**主要映射**:
- 任务管理: tasks 表
- 节点配置: crawler_nodes 表
- 参数管理: data_extraction_params 表
- 执行日志: task_logs 表
- 结果存储: task_results 表

### SeleniumService (src/services/selenium.service.ts)
**主要映射**:
- 浏览器配置: browser_configs 表
- 窗口管理: 内部状态，可记录到 websocket_connections

### WebSocketService (src/services/websocket.service.ts)
**主要映射**:
- 连接管理: websocket_connections 表
- 消息路由: 任务日志记录到 task_logs

## 数据库视图

### v_task_stats
任务统计视图，提供：
- 任务执行总次数
- 成功/失败次数
- 最后运行时间
- 平均执行时长

### v_task_result_stats
任务结果统计视图，提供：
- 各种类型结果的数量统计
- 结果时间范围

## 存储过程

### cleanup_old_logs(days_to_keep)
清理过期日志数据，支持：
- 清理指定天数前的任务日志
- 清理指定天数前的结果数据
- 清理过期的连接记录

### update_next_execute_time(task_id)
更新任务的下次执行时间：
- 根据任务间隔设置下次执行时间
- 更新最后执行时间

## 索引策略

### 主要索引
- 任务表: status, next_execute_at, created_at
- 日志表: task_id, execution_id, start_time, level
- 节点表: task_id, node_index (唯一复合索引)
- 参数表: node_id, param_index (唯一复合索引)
- 结果表: task_id, execution_id, created_at

### 外键关系
- task_logs.task_id -> tasks.id (CASCADE)
- crawler_nodes.task_id -> tasks.id (CASCADE)
- data_extraction_params.node_id -> crawler_nodes.id (CASCADE)
- task_results.task_id -> tasks.id (CASCADE)

## 使用说明

### 1. 初始化数据库
```sql
-- 执行初始化脚本
mysql -u root -p < db/init.sql
```

### 2. 应用配置
```json
// mysql_config.json
{
  "host": "localhost",
  "port": 3306,
  "username": "root",
  "password": "123456",
  "database": "reliableSpider"
}
```

### 3. 代码集成
在TypeScript服务中，通过配置文件连接数据库：
```typescript
import mysql from 'mysql2/promise';
import config from '../mysql_config.json';

const connection = await mysql.createConnection(config);
```

## 扩展建议

### 1. 性能优化
- 定期执行清理存储过程
- 根据业务需求调整索引
- 大文本字段考虑分表存储

### 2. 监控告警
- 基于任务状态统计设置告警
- 监控数据库连接状态
- 记录系统性能指标

### 3. 数据备份
- 定期备份任务配置
- 导出重要结果数据
- 保留操作审计日志