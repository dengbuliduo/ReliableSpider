// ============================================
// 全局配置常量 - 便于统一管理和修改
// ============================================

// 服务器配置
const SERVER_CONFIG = {
    // 主服务器端口
    MAIN_PORT: 8074,
    // 文件上传服务器端口
    FILE_UPLOAD_PORT: 8075,
    // 服务器地址
    SERVER_ADDRESS: "http://localhost",
    // 允许的跨域源
    CORS_ORIGIN: "*",
    // 默认字符集
    CHARSET: 'utf-8',
    // 内容类型
    CONTENT_TYPES: {
        JSON: "application/json",
        HTML: "text/html",
        TEXT: "text/plain"
    }
};

// 文件路径配置
const PATH_CONFIG = {
    // 目录名称
    DIRECTORIES: {
        TASKS: "tasks",
        EXECUTION_INSTANCES: "execution_instances",
        DATA: "Data",
        USER_DATA: "./user_data"
    },
    // 文件名称
    FILES: {
        CONFIG: "config.json",
        MIME: "mime.json",
        MYSQL_CONFIG: "mysql_config.json"
    },
    // 文件扩展名
    EXTENSIONS: {
        JSON: ".json",
        DOT_JSON: ".json"
    }
};

// 默认配置值
const DEFAULT_CONFIG = {
    WEBSERVER_ADDRESS: "http://localhost",
    WEBSERVER_PORT: 8074,
    USER_DATA_FOLDER: "./user_data",
    DEBUG: true,
    LANG: "-",
    COPYRIGHT: 0,
    SYS_ARCH: require("os").arch(),
    MYSQL_CONFIG_PATH: "./mysql_config.json",
};

// MySQL 默认配置
const MYSQL_DEFAULT_CONFIG = {
    HOST: "localhost",
    PORT: 3306,
    USERNAME: "your_username",
    PASSWORD: "your_password",
    DATABASE: "your_database"
};

// 任务相关常量
const TASK_CONSTANTS = {
    // 特殊任务ID
    SPECIAL_IDS: {
        DELETED_TASK: -2,
        NEW_TASK: -1
    },
    // 默认链接
    DEFAULT_LINK: "about:blank",
    // 文件上传大小限制 (200MB)
    MAX_FILE_SIZE: 200 * 1024 * 1024
};

// 错误消息
const ERROR_MESSAGES = {
    TASK_NOT_FOUND: "Cannot find task based on specified task ID.",
    EXECUTION_INSTANCE_NOT_FOUND: "Cannot find execution instance based on specified execution ID.",
    INVALID_PATH: "Invalid path",
    FILE_NOT_EXISTS: "File does not exist. Creating...",
    FILE_EXISTS: "File exists.",
    FILE_CREATED: "File is created successfully."
};

// 成功消息
const SUCCESS_MESSAGES = {
    TASK_DELETED: "Task has been deleted successfully.",
    USER_DATA_FOLDER_SET: "User data folder has been set successfully.",
    FILE_UPLOADED: "File uploaded and read successfully."
};

// 服务器状态消息
const SERVER_MESSAGES = {
    STARTED: "Server has started.",
    LISTENING: "Server listening on http://localhost:"
};

// ============================================
// 模块导入
// ============================================

const http = require("http");
const querystring = require("querystring");
const url = require("url");
const fs = require("fs");
const path = require("path");
const { app, dialog } = require("electron");
const XLSX = require("xlsx");
const formidable = require("formidable");
const express = require("express");
const multer = require("multer");
const cors = require("cors");

function travel(dir, callback) {
    fs.readdirSync(dir).forEach((file) => {
        const pathname = path.join(dir, file);
        if (fs.statSync(pathname).isDirectory()) {
            travel(pathname, callback);
        } else {
            callback(pathname);
        }
    });
}

function compare(p) {
    //这是比较函数
    return function(m, n) {
        let a = m[p];
        let b = n[p];
        return b - a; //降序
    };
}

function getDir() {
    if (__dirname.indexOf("app") >= 0 && __dirname.indexOf("sources") >= 0) {
        if (process.platform == "darwin") {
            return app.getPath("userData");
        } else {
            return path.join(__dirname, "../../..");
        }
    } else {
        return __dirname;
    }
}

function getReliableSpiderLocation() {
    if (__dirname.indexOf("app") >= 0 && __dirname.indexOf("sources") >= 0) {
        if (process.platform == "darwin") {
            return path.join(__dirname, "../../../");
        } else {
            return path.join(__dirname, "../../../");
        }
    } else {
        return __dirname;
    }
}
// 创建必要的目录
if (!fs.existsSync(path.join(getDir(), PATH_CONFIG.DIRECTORIES.TASKS))) {
    fs.mkdirSync(path.join(getDir(), PATH_CONFIG.DIRECTORIES.TASKS));
}
if (!fs.existsSync(path.join(getDir(), PATH_CONFIG.DIRECTORIES.EXECUTION_INSTANCES))) {
    fs.mkdirSync(path.join(getDir(), PATH_CONFIG.DIRECTORIES.EXECUTION_INSTANCES));
}

// 生成默认配置文件
if (!fs.existsSync(path.join(getDir(), PATH_CONFIG.FILES.CONFIG))) {
    fs.writeFileSync(
        path.join(getDir(), PATH_CONFIG.FILES.CONFIG),
        JSON.stringify(DEFAULT_CONFIG)
    );
}

exports.getDir = getDir;
exports.getReliableSpiderLocation = getReliableSpiderLocation;
FileMimes = JSON.parse(
    fs.readFileSync(path.join(__dirname, PATH_CONFIG.FILES.MIME)).toString()
);

const fileServer = express();
const upload = multer({ dest: path.join(getDir(), PATH_CONFIG.DIRECTORIES.DATA + "/") });

fileServer.use(cors());
fileServer.post("/excelUpload", upload.single("file"), (req, res) => {
    let workbook = XLSX.readFile(req.file.path);
    let sheet_name_list = workbook.SheetNames;
    let data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
    let result = data.reduce((acc, obj) => {
        Object.keys(obj).forEach((key) => {
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(obj[key]);
        });
        return acc;
    }, {});
    // console.log(data);
    // delete file after reading
    fs.unlink(req.file.path, (err) => {
        if (err) {
            console.error(err);
            return;
        }
        // file removed
    });
    res.send(JSON.stringify(result));
});

fileServer.listen(SERVER_CONFIG.FILE_UPLOAD_PORT, () => {
    console.log(SERVER_MESSAGES.LISTENING + SERVER_CONFIG.FILE_UPLOAD_PORT);
});

exports.start = function(port = SERVER_CONFIG.MAIN_PORT) {
    http
        .createServer(function(req, res) {
            let body = "";
            res.setHeader("Access-Control-Allow-Origin", SERVER_CONFIG.CORS_ORIGIN); // 设置可访问的源
            // 解析参数
            const pathName = url.parse(req.url).pathname;
            const safeBase = path.join(__dirname, "src");

            const safeJoin = (base, target) => {
                const targetPath = "." + path.posix.normalize("/" + target);
                return path.join(base, targetPath);
            };

            // Serve local vendor files from node_modules when path starts with /vendor/
            if (pathName.startsWith('/vendor/')) {
                try {
                    // map /vendor/<pkg>/... -> node_modules/<pkg>/...
                    const vendorRel = pathName.replace(/^\/vendor\//, '');
                    const filePath = path.join(__dirname, 'node_modules', vendorRel);
                    if (!fs.existsSync(filePath)) {
                        res.writeHead(404, { "Content-Type": SERVER_CONFIG.CONTENT_TYPES.HTML + ';charset="' + SERVER_CONFIG.CHARSET + '"' });
                        res.end('Not found');
                        return;
                    }
                    const extname = path.extname(filePath);
                    const mime = FileMimes[extname] || 'application/octet-stream';
                    const data = fs.readFileSync(filePath);
                    res.writeHead(200, { "Content-Type": mime + ';charset="' + SERVER_CONFIG.CHARSET + '"' });
                    res.end(data);
                    return;
                } catch (e) {
                    res.writeHead(500, { "Content-Type": SERVER_CONFIG.CONTENT_TYPES.HTML + ';charset="' + SERVER_CONFIG.CHARSET + '"' });
                    res.end('Internal server error');
                    return;
                }
            }
            if (pathName == "/excelUpload" && req.method.toLowerCase() === "post") {} else if (pathName.indexOf(".") < 0) {
                //如果没有后缀名, 则为后台请求
                res.writeHead(200, { "Content-Type": "application/json" });
            } else {
                //如果有后缀名, 则为前端请求
                const filePath = safeJoin(safeBase, pathName);

                if (!filePath.startsWith(safeBase)) {
                    res.writeHead(400, { "Content-Type": SERVER_CONFIG.CONTENT_TYPES.HTML + ';charset="' + SERVER_CONFIG.CHARSET + '"' });
                    res.end(ERROR_MESSAGES.INVALID_PATH);
                    return;
                }

                fs.readFile(
                    filePath,
                    async(err, data) => {
                        if (err) {
                            res.writeHead(404, {
                                "Content-Type": SERVER_CONFIG.CONTENT_TYPES.HTML + ';charset="' + SERVER_CONFIG.CHARSET + '"',
                            });
                            res.end(err.message);
                            return;
                        }
                        if (!err) {
                            // 3. 针对不同的文件返回不同的内容头
                            let extname = path.extname(pathName);
                            let mime = FileMimes[extname];
                            res.writeHead(200, { "Content-Type": mime + ';charset="' + SERVER_CONFIG.CHARSET + '"' });
                            res.end(data);
                            return;
                        }
                    }
                );
            }

            req.on("data", function(chunk) {
                body += chunk;
            });
            req.on("end", function() {
                // 设置响应头部信息及编码
                if (pathName == "/queryTasks") {
                    //查询所有服务信息，只包括id和服务名称
                    output = [];
                    travel(path.join(getDir(), PATH_CONFIG.DIRECTORIES.TASKS), function(pathname) {
                        const data = fs.readFileSync(pathname, SERVER_CONFIG.CHARSET);
                        let stat = fs.statSync(pathname, SERVER_CONFIG.CHARSET);
                        if (pathname.indexOf(".json") >= 0) {
                            const task = JSON.parse(data);
                            let item = {
                                id: task.id,
                                name: task.name,
                                url: task.links.split("\n")[0],
                                mtime: stat.mtime,
                                links: task.links,
                                desc: task.desc,
                            };
                            if (item.id != -2) {
                                output.push(item);
                            }
                        }
                    });
                    output.sort(compare("mtime"));
                    res.write(JSON.stringify(output));
                    res.end();
                } else if (pathName == "/queryOSVersion") {
                    res.write(
                        JSON.stringify({ version: process.platform, bit: process.arch })
                    );
                    res.end();
                } else if (pathName == "/queryExecutionInstances") {
                    //查询所有服务信息，只包括id和服务名称
                    output = [];
                    travel(
                        path.join(getDir(), PATH_CONFIG.DIRECTORIES.EXECUTION_INSTANCES),
                        function(pathname) {
                            const data = fs.readFileSync(pathname, SERVER_CONFIG.CHARSET);
                            // parse JSON string to JSON object
                            const task = JSON.parse(data);
                            let item = {
                                id: task.id,
                                name: task.name,
                                url: task.url,
                            };
                            if (item.id != -2) {
                                output.push(item);
                            }
                        }
                    );
                    res.write(JSON.stringify(output));
                    res.end();
                } else if (pathName == "/queryTask") {
                    let params = url.parse(req.url, true).query;
                    try {
                        let tid = parseInt(params.id);
                        const data = fs.readFileSync(
                            path.join(getDir(), `${PATH_CONFIG.DIRECTORIES.TASKS}/${tid}${PATH_CONFIG.EXTENSIONS.JSON}`),
                            SERVER_CONFIG.CHARSET
                        );
                        // parse JSON string to JSON object
                        res.write(data);
                        res.end();
                    } catch (error) {
                        res.write(
                            JSON.stringify({
                                error: "Cannot find task based on specified task ID.",
                            })
                        );
                        res.end();
                    }
                } else if (pathName == "/queryExecutionInstance") {
                    let params = url.parse(req.url, true).query;
                    try {
                        let tid = parseInt(params.id);
                        const data = fs.readFileSync(
                            path.join(getDir(), `${PATH_CONFIG.DIRECTORIES.EXECUTION_INSTANCES}/${tid}${PATH_CONFIG.EXTENSIONS.JSON}`),
                            SERVER_CONFIG.CHARSET
                        );
                        // parse JSON string to JSON object
                        res.write(data);
                        res.end();
                    } catch (error) {
                        res.write(
                            JSON.stringify({
                                error: "Cannot find execution instance based on specified execution ID.",
                            })
                        );
                        res.end();
                    }
                } else if (pathName == "/") {
                    res.write("Hello World!", SERVER_CONFIG.CHARSET);
                    res.end();
                } else if (pathName == "/deleteTask") {
                    let params = url.parse(req.url, true).query;
                    try {
                        let tid = parseInt(params.id);
                        let data = fs.readFileSync(
                            path.join(getDir(), `${PATH_CONFIG.DIRECTORIES.TASKS}/${tid}${PATH_CONFIG.EXTENSIONS.JSON}`),
                            SERVER_CONFIG.CHARSET
                        );
                        data = JSON.parse(data);
                        data.id = -2;
                        data = JSON.stringify(data);
                        // write JSON string to a file
                        fs.writeFile(
                            path.join(getDir(), `tasks/${tid}.json`),
                            data,
                            (err) => {
                                if (err) {
                                    throw err;
                                }
                            }
                        );
                        res.write(
                            JSON.stringify({ success: "Task has been deleted successfully." })
                        );
                        res.end();
                    } catch (error) {
                        res.write(
                            JSON.stringify({
                                error: "Cannot find task based on specified task ID.",
                            })
                        );
                        res.end();
                    }
                } else if (pathName == "/manageTask") {
                    body = querystring.parse(body);
                    data = JSON.parse(body.params);
                    let id = data["id"];
                    if (data["id"] == TASK_CONSTANTS.SPECIAL_IDS.NEW_TASK) {
                        file_names = [];
                        fs.readdirSync(path.join(getDir(), PATH_CONFIG.DIRECTORIES.TASKS)).forEach((file) => {
                            try {
                                if (file.split(".")[1] == "json") {
                                    file_names.push(parseInt(file.split(".")[0]));
                                }
                            } catch (error) {}
                        });
                        if (file_names.length == 0) {
                            id = 0;
                        } else {
                            id = Math.max(...file_names) + 1;
                        }
                        data["id"] = id;
                        // write JSON string to a fil
                    }
                    if (data["outputFormat"] == "mysql") {
                        let mysql_config_path = path.join(getDir(), PATH_CONFIG.FILES.MYSQL_CONFIG);
                        // 检测文件是否存在
                        fs.access(mysql_config_path, fs.F_OK, (err) => {
                            if (err) {
                                console.log(ERROR_MESSAGES.FILE_NOT_EXISTS);
                                // 文件不存在，创建文件
                                const config = MYSQL_DEFAULT_CONFIG;
                                fs.writeFile(
                                    mysql_config_path,
                                    JSON.stringify(config, null, 4),
                                    (err) => {
                                        if (err) throw err;
                                        console.log(ERROR_MESSAGES.FILE_CREATED);
                                    }
                                );
                            } else {
                                console.log(ERROR_MESSAGES.FILE_EXISTS);
                            }
                        });
                    }
                    data = JSON.stringify(data);
                    // write JSON string to a file
                    fs.writeFile(
                        path.join(getDir(), `${PATH_CONFIG.DIRECTORIES.TASKS}/${id}${PATH_CONFIG.EXTENSIONS.JSON}`),
                        data,
                        (err) => {}
                    );

                    res.write(id.toString(), SERVER_CONFIG.CHARSET);
                    res.end();
                } else if (pathName == "/invokeTask") {
                    body = querystring.parse(body);
                    let data = JSON.parse(body.params);
                    let id = body.id;
                    let task = fs.readFileSync(
                        path.join(getDir(), `${PATH_CONFIG.DIRECTORIES.TASKS}/${id}${PATH_CONFIG.EXTENSIONS.JSON}`),
                        SERVER_CONFIG.CHARSET
                    );
                    task = JSON.parse(task);
                    try {
                        task["links"] = data["urlList_0"];
                        if (task["links"] == undefined) {
                            task["links"] = TASK_CONSTANTS.DEFAULT_LINK;
                        }
                    } catch (error) {
                        task["links"] = TASK_CONSTANTS.DEFAULT_LINK;
                    }
                    for (const [key, value] of Object.entries(data)) {
                        for (let i = 0; i < task["inputParameters"].length; i++) {
                            if (key === task["inputParameters"][i]["name"]) {
                                // 能调用
                                const nodeId = parseInt(task["inputParameters"][i]["nodeId"]);
                                const node = task["graph"][nodeId];
                                if (node["option"] === 1) {
                                    node["parameters"]["links"] = value;
                                } else if (node["option"] === 4) {
                                    node["parameters"]["value"] = value;
                                } else if (
                                    node["option"] === 8 &&
                                    node["parameters"]["loopType"] === 0
                                ) {
                                    node["parameters"]["exitCount"] = parseInt(value);
                                } else if (node["option"] === 8) {
                                    node["parameters"]["textList"] = value;
                                }
                                break;
                            }
                        }
                    }
                    let file_names = [];
                    fs.readdirSync(path.join(getDir(), PATH_CONFIG.DIRECTORIES.EXECUTION_INSTANCES)).forEach(
                        (file) => {
                            try {
                                if (file.split(".")[1] == "json") {
                                    file_names.push(parseInt(file.split(".")[0]));
                                }
                                console.log(file);
                            } catch (error) {}
                        }
                    );
                    let eid = 0;
                    if (file_names.length != 0) {
                        eid = Math.max(...file_names) + 1;
                    }
                    if (body["EID"] != "" && body["EID"] != undefined) {
                        //覆盖原有的执行实例
                        eid = parseInt(body["EID"]);
                    }
                    task["id"] = eid;
                    task = JSON.stringify(task);
                    fs.writeFile(
                        path.join(getDir(), `execution_instances/${eid}.json`),
                        task,
                        (err) => {}
                    );
                    res.write(eid.toString(), SERVER_CONFIG.CHARSET);
                    res.end();
                } else if (pathName == "/getConfig") {
                    let config_file = fs.readFileSync(
                        path.join(getDir(), PATH_CONFIG.FILES.CONFIG),
                        SERVER_CONFIG.CHARSET
                    );
                    config_file = JSON.parse(config_file);
                    let lang = config_file["lang"];
                    if (lang == undefined) {
                        lang = "-";
                    }
                    res.write(JSON.stringify(config_file));
                    res.end();
                } else if (pathName == "/setUserDataFolder") {
                    let config = fs.readFileSync(
                        path.join(getDir(), PATH_CONFIG.FILES.CONFIG),
                        SERVER_CONFIG.CHARSET
                    );
                    config = JSON.parse(config);
                    body = querystring.parse(body);
                    config["user_data_folder"] = body["user_data_folder"];
                    config = JSON.stringify(config);
                    fs.writeFile(path.join(getDir(), PATH_CONFIG.FILES.CONFIG), config, (err) => {});
                    res.write(
                        JSON.stringify({
                            success: SUCCESS_MESSAGES.USER_DATA_FOLDER_SET,
                        })
                    );
                    res.end();
                }
            });
        })
        .listen(port);
    console.log(SERVER_MESSAGES.STARTED);
};

// ============================================
// 模块导出
// ============================================

module.exports = {
    SERVER_CONFIG,
    PATH_CONFIG,
    DEFAULT_CONFIG,
    MYSQL_DEFAULT_CONFIG,
    TASK_CONSTANTS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    SERVER_MESSAGES,
    start: exports.start,
    getDir
};