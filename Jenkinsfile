pipeline {
    // 使用 Kubernetes Pod Template
    agent {
        kubernetes {
            cloud 'kubernetes'

            yaml '''
apiVersion: v1
kind: Pod
metadata:
  labels:
    jenkins/label: nightdeal-build
spec:
  containers:
    # -------------------------------------------------------
    # 1. Node.js 容器（用于测试和构建）
    # -------------------------------------------------------
    - name: node
      image: node:22-alpine
      command:
        - sleep
      args:
        - "9999999"
      tty: true
      workingDir: /home/jenkins/agent
      volumeMounts:
        - mountPath: /home/jenkins/agent/node_modules
          name: node-modules-cache

    # -------------------------------------------------------
    # 2. Docker 容器（用于构建和推送镜像）
    # -------------------------------------------------------
    - name: docker
      image: docker:latest
      command:
        - sleep
      args:
        - "9999999"
      tty: true
      workingDir: /home/jenkins/agent
      volumeMounts:
        - mountPath: /var/run/docker.sock
          name: docker-sock

    # -------------------------------------------------------
    # 3. SSH 容器（用于远程部署）
    # 使用 docker:latest 镜像，因为它基于 Alpine 且支持 apk
    # -------------------------------------------------------
    - name: ssh
      image: docker:latest
      command:
        - sleep
      args:
        - "9999999"
      tty: true
      workingDir: /home/jenkins/agent

  volumes:
    # Node modules 缓存卷
    - name: node-modules-cache
      emptyDir: {}

    # Docker Socket 挂载
    - name: docker-sock
      hostPath:
        path: /var/run/docker.sock
'''
        }
    }

    parameters {
        booleanParam(name: 'SONAR_ENABLED', defaultValue: false, description: '是否运行 SonarQube 代码质量分析（需要先安装 sonar-scanner）')
        string(name: 'DOCKER_NETWORK', defaultValue: 'nightdeal_default', description: 'Docker 网络名称（服务器上 PostgreSQL/Redis 所在网络）。可通过 `docker network ls` 查看')
    }

    stages {
        stage('1. 拉取代码') {
            steps {
                checkout scm
            }
        }

        stage('2. 安装依赖') {
            steps {
                container('node') {
                    script {
                        withCredentials([
                            file(credentialsId: 'nightdeal-prod-env', variable: 'APP_ENV_FILE')
                        ]) {
                            sh '''
                                cp ${APP_ENV_FILE} .env
                                npm ci
                                npx prisma generate
                            '''
                        }
                    }
                }
            }
        }

        stage('3. 单元测试') {
            steps {
                container('node') {
                    script {
                        withCredentials([
                            file(credentialsId: 'nightdeal-prod-env', variable: 'APP_ENV_FILE')
                        ]) {
                            sh '''
                                cp ${APP_ENV_FILE} .env
                                echo "已加载生产环境配置文件"
                                npm test
                            '''
                        }
                    }
                }
            }
        }

        stage('4. SonarQube 代码质量分析') {
            when {
                expression { return params.SONAR_ENABLED }
            }
            steps {
                container('node') {
                    withSonarQubeEnv('sonar-server') {
                        // 先生成覆盖率报告
                        sh 'npm run test:cov'
                        // 注意：需要在容器中安装 sonar-scanner 或使用 Jenkins SonarQube Scanner 插件
                        // 如果使用 SonarQube Scanner 插件，取消下面的注释：
                        // sh 'sonar-scanner'
                        echo '⚠️  SonarQube 分析需要额外配置 sonar-scanner，请参考文档完成设置'
                    }
                }
            }
        }

        stage('5. 构建并推送 Docker 镜像') {
            when {
                not { changeRequest() }
            }
            steps {
                container('docker') {
                    script {
                        withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                            // 配置 Git 安全目录
                            sh '''
                                git config --global --add safe.directory ${WORKSPACE} || true
                                git config --global --add safe.directory "$(pwd)" || true
                            '''

                            def gitCommit = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
                            def branchName = env.BRANCH_NAME ?: sh(returnStdout: true, script: 'git rev-parse --abbrev-ref HEAD').trim()

                            echo "当前分支: ${branchName}, Commit Hash: ${gitCommit}"

                            // 登录 Docker Hub
                            sh '''
                                echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                            '''

                            // 构建镜像
                            sh '''
                                docker build -t $DOCKER_USER/nightdeal-backend:latest -f Dockerfile .
                            '''

                            // 根据分支和标签推送不同版本
                            if (env.TAG_NAME) {
                                sh '''
                                    docker tag $DOCKER_USER/nightdeal-backend:latest $DOCKER_USER/nightdeal-backend:''' + env.TAG_NAME + '''
                                    docker push $DOCKER_USER/nightdeal-backend:''' + env.TAG_NAME + '''
                                    docker push $DOCKER_USER/nightdeal-backend:latest
                                '''
                            } else if (branchName == 'main' || branchName == 'master') {
                                sh '''
                                    docker tag $DOCKER_USER/nightdeal-backend:latest $DOCKER_USER/nightdeal-backend:commit-''' + gitCommit + '''
                                    docker push $DOCKER_USER/nightdeal-backend:commit-''' + gitCommit + '''
                                    docker tag $DOCKER_USER/nightdeal-backend:latest $DOCKER_USER/nightdeal-backend:build-''' + env.BUILD_NUMBER + '''
                                    docker push $DOCKER_USER/nightdeal-backend:build-''' + env.BUILD_NUMBER + '''
                                    docker push $DOCKER_USER/nightdeal-backend:latest
                                '''
                            } else {
                                def safeBranchName = branchName.replace("/", "-").replace("_", "-")
                                sh '''
                                    docker tag $DOCKER_USER/nightdeal-backend:latest $DOCKER_USER/nightdeal-backend:dev-''' + safeBranchName + '-' + gitCommit + '''
                                    docker push $DOCKER_USER/nightdeal-backend:dev-''' + safeBranchName + '-' + gitCommit + '''
                                '''
                            }
                        }
                    }
                }
            }
        }

        stage('6. 部署到服务器') {
            when {
                allOf {
                    branch 'main'
                    not { changeRequest() }
                }
            }
            steps {
                // 使用 SSH 容器进行部署
                container('ssh') {
                    script {
                        withCredentials([
                            sshUserPrivateKey(credentialsId: 'server-ssh-key', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER'),
                            string(credentialsId: 'server-host', variable: 'SERVER_HOST'),
                            usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS'),
                            file(credentialsId: 'nightdeal-prod-env', variable: 'APP_ENV_FILE')
                        ]) {
                            // 1. 安装必要工具
                            sh '''
                                apk add --no-cache openssh-client curl
                            '''

                            // 2. 准备环境变量文件
                            sh "cp ${APP_ENV_FILE} app_env.tmp"

                            // 3. 使用 Groovy 生成部署脚本
                            // 注意：globalPrefix('api') 在 main.ts 中设置，所以健康检查路径是 /api/health
                            def dockerNetwork = params.DOCKER_NETWORK ?: 'nightdeal-backend_default'
                            def deployScript = """#!/bin/bash
                                set -e
                                mkdir -p /opt/nightdeal/config
                                mv /tmp/nightdeal-prod.env.tmp /opt/nightdeal/config/nightdeal-prod.env
                                chmod 600 /opt/nightdeal/config/nightdeal-prod.env

                                # 登录 Docker Hub（私有仓库需要认证才能 pull）
                                echo "${DOCKER_PASS}" | docker login -u "${DOCKER_USER}" --password-stdin

                                echo "正在拉取镜像: ${DOCKER_USER}/nightdeal-backend:latest"
                                docker pull ${DOCKER_USER}/nightdeal-backend:latest

                                # 创建 Docker 网络（如果不存在）
                                if ! docker network inspect ${dockerNetwork} > /dev/null 2>&1; then
                                    echo "创建 Docker 网络: ${dockerNetwork}"
                                    docker network create ${dockerNetwork}
                                else
                                    echo "Docker 网络已存在: ${dockerNetwork}"
                                fi

                                # 保存旧镜像 ID 用于回滚
                                OLD_IMAGE=\$(docker inspect --format='{{.Image}}' nightdeal-backend 2>/dev/null || echo "")

                                # 停止并移除旧容器
                                docker stop nightdeal-backend || true
                                docker rm nightdeal-backend || true

                                # 启动新容器（使用 docker run）
                                docker run -d \\
                                    --name nightdeal-backend \\
                                    --network ${dockerNetwork} \\
                                    --env-file /opt/nightdeal/config/nightdeal-prod.env \\
                                    -p 3000:3000 \\
                                    --restart unless-stopped \\
                                    ${DOCKER_USER}/nightdeal-backend:latest

                                # 等待容器启动
                                echo "等待容器启动..."
                                sleep 5

                                # 健康检查函数（包含回滚逻辑）
                                rollback_and_exit() {
                                    echo "❌ \$1，正在回滚..."
                                    # 先捕获日志，再停止容器
                                    echo "--- 失败容器日志 ---"
                                    docker logs --tail 50 nightdeal-backend 2>&1 || true
                                    echo "--- 日志结束 ---"
                                    docker stop nightdeal-backend || true
                                    docker rm nightdeal-backend || true
                                    if [ -n "\$OLD_IMAGE" ]; then
                                        docker run -d \\
                                            --name nightdeal-backend \\
                                            --network ${dockerNetwork} \\
                                            --env-file /opt/nightdeal/config/nightdeal-prod.env \\
                                            -p 3000:3000 \\
                                            --restart unless-stopped \\
                                            \$OLD_IMAGE
                                        echo "已回滚到旧版本"
                                    fi
                                    exit 1
                                }

                                # 检查容器是否启动
                                if ! docker ps | grep -q nightdeal-backend; then
                                    rollback_and_exit "容器启动失败"
                                fi

                                echo "✅ 容器已启动"

                                # 检查应用是否响应（注意：路径是 /api/health 因为 main.ts 设置了 globalPrefix）
                                for i in \$(seq 1 12); do
                                    if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
                                        echo "✅ 应用健康检查通过！部署成功！"
                                        # 清理远程临时文件
                                        rm -f /tmp/deploy.sh /tmp/nightdeal-prod.env.tmp
                                        exit 0
                                    fi
                                    echo "等待应用就绪... (\$i/12)"
                                    sleep 5
                                done

                                # 健康检查超时，回滚
                                rollback_and_exit "应用启动超时"
                            """

                            // 4. 将脚本写入文件
                            writeFile file: 'deploy.sh', text: deployScript

                            // 5. 上传并执行
                            sh """
                                mkdir -p ~/.ssh
                                cat "${SSH_KEY}" > ~/.ssh/deploy_key
                                chmod 600 ~/.ssh/deploy_key

                                # 上传环境变量文件
                                scp -i ~/.ssh/deploy_key -o StrictHostKeyChecking=no app_env.tmp ${SSH_USER}@${SERVER_HOST}:/tmp/nightdeal-prod.env.tmp

                                # 上传部署脚本
                                scp -i ~/.ssh/deploy_key -o StrictHostKeyChecking=no deploy.sh ${SSH_USER}@${SERVER_HOST}:/tmp/deploy.sh

                                # 远程执行部署脚本
                                echo "正在远程执行部署脚本..."
                                ssh -i ~/.ssh/deploy_key -o StrictHostKeyChecking=no ${SSH_USER}@${SERVER_HOST} "bash /tmp/deploy.sh"

                                # 清理本地临时文件
                                rm -f ~/.ssh/deploy_key app_env.tmp deploy.sh
                            """
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo '✅ Pipeline 执行成功！'
        }
        failure {
            echo '❌ Pipeline 执行失败，请检查日志。'
        }
    }
}
