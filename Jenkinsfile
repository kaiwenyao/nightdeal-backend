// =============================================================================
// nightdeal-backend 持续集成流水线（测试 + 构建 + 镜像推送 + GitOps）
// =============================================================================
// 运行形态与 vimpaste 项目一致：每次构建由 Jenkins Kubernetes 插件在集群里
// 临时创建一个 Pod 作为构建代理，构建结束后 Pod 销毁。Pod 里有三个业务容器：
//
//   nodejs —— 安装依赖、单元测试、后端构建（内含 Node.js 24）
//   docker —— 构建并推送镜像（内含 docker CLI）
//   gitops —— Git 操作与修改 YAML（内含 git）
//
// 插件还会自动注入一个 jnlp 容器负责和 Jenkins master 通信，无需在此声明。
// 流水线的每个 steps 默认落在 jnlp 容器里，所以凡是要用 nodejs、docker 或
// gitops 的步骤，都必须用 container('nodejs') / container('docker') /
// container('gitops') 显式切换。
//
// 与 vimpaste 的差异：
//   - NestJS 后端：测试前需要先 npx prisma generate 生成 Prisma Client；
//     单测全部 mock 外部依赖（DB/Redis/OSS），不需要注入任何环境变量，
//     且 package.json 里配置了 80% 的全局覆盖率门槛，跌破即构建失败。
//   - 镜像推送到 ghcr.io/kaiwenyao/nightdeal-backend，标签只打 commit 短
//     SHA，不打 latest，每个 commit 的镜像不可变，可随时按 SHA 回溯。
//   - GitOps 目标清单是 k3s-home 仓库的 apps/nightdeal/deployment.yaml。
// =============================================================================
pipeline {
    agent {
        kubernetes {
            // Jenkins「系统管理 → 节点和云」中配置的 Kubernetes 云名称。
            // 与 vimpaste 各流水线共用同一个云；若那里改了名字，这里要同步。
            cloud 'kubernetes'

            // 直接在流水线里内联 Pod 定义，而不是引用 Jenkins UI 上预设的
            // Pod Template，构建环境随代码一起版本化，可评审、可回滚。
            yaml '''
apiVersion: v1
kind: Pod
metadata:
  labels:
    jenkins/label: nightdeal-build
spec:
  containers:
    # -------------------------------------------------------
    # 容器一：nodejs —— 安装依赖、单元测试、后端构建
    # -------------------------------------------------------
    # command/args 覆写成 sleep 是 Jenkins K8s 插件的固定写法：容器必须保持
    # 存活，等流水线用 container('nodejs') 进来执行命令。若不覆写，镜像跑完
    # 默认入口就退出了，Pod 随即失败。
    - name: nodejs
      image: node:24-alpine
      command:
        - sleep
      args:
        - "9999999"
      tty: true
      workingDir: /home/jenkins/agent

    # -------------------------------------------------------
    # 容器二：docker —— 构建并推送镜像
    # -------------------------------------------------------
    # 只装了 docker CLI，没有 Docker 守护进程；实际工作交给下面挂进来的
    # 宿主机 socket 上的守护进程执行。
    - name: docker
      image: docker:latest
      command:
        - sleep
      args:
        - "9999999"
      tty: true
      workingDir: /home/jenkins/agent
      volumeMounts:
        # docker CLI 通过这个 socket 指挥宿主节点的 Docker 守护进程干活
        - mountPath: /var/run/docker.sock
          name: docker-sock

    # -------------------------------------------------------
    # 容器三：gitops —— Git 操作与修改 YAML
    # -------------------------------------------------------
    # 基础 alpine 镜像，启动时现场安装 git。它只做 Git 操作和改 YAML
    # （GitOps），不需要操作 Docker 守护进程，因此不挂载
    # /var/run/docker.sock。
    - name: gitops
      image: alpine:3.22
      command:
        - sh
        - -c
      args:
        - apk add --no-cache git ca-certificates && sleep 9999999
      tty: true
      workingDir: /home/jenkins/agent

  # -------------------------------------------------------
  # 卷定义
  # -------------------------------------------------------
  volumes:
    # 宿主节点的 Docker 守护进程 socket。与 vimpaste 相同的做法；
    # 该挂载的信任边界说明见相关流水线的 Jenkinsfile。
    - name: docker-sock
      hostPath:
        path: /var/run/docker.sock
'''
        }
    }

    stages {
        stage('1. 拉取代码') {
            steps {
                checkout scm
            }
        }

        stage('2. 安装依赖') {
            steps {
                container('nodejs') {
                    echo '安装依赖...'
                    sh 'npm ci'
                    // Prisma Client 不随源码入库，安装后现场生成
                    sh 'npx prisma generate'
                }
            }
        }

        stage('3. 单元测试') {
            steps {
                container('nodejs') {
                    // jest 全量单测 + 覆盖率统计。coverageThreshold 全局门槛
                    // 80%（语句/分支/函数/行）写在 package.json 里，跌破会以
                    // 非零退出码失败。单测全部 mock，无需任何 .env。
                    // --silent 让 CI 日志只保留结果，不被逐个用例日志刷屏。
                    echo '正在运行单元测试（Jest + 覆盖率门槛）...'
                    sh 'npm test -- --coverage --silent'
                }
            }
        }

        stage('4. 构建项目') {
            steps {
                container('nodejs') {
                    // nest build：让 TypeScript 编译错误在独立阶段就暴露，
                    // 比等到 docker build 内部才失败更快更清晰
                    echo '构建后端项目（nest build）...'
                    sh 'npm run build'
                }
            }
        }

        stage('5. 构建并推送镜像') {
            // 不区分分支与 PR：任何构建（包括 PR 构建）都推送镜像，
            // 便于在合入前就能拿 PR 的镜像到真实环境（如 k3s）验证。
            // 标签是本次 commit 的短 SHA，各分支/PR 的镜像互不覆盖。
            steps {
                container('docker') {
                    script {
                        // GitHub Container Registry 登录凭据：与 vimpaste 共用
                        // 专用凭据 ghcr-token（usernamePassword 类型）：用户名 =
                        // kaiwenyao，密码 = 勾选了 write:packages 的 classic PAT。
                        // 该凭据只用于推镜像，权限最小化；Git 操作走 k3s-home-write。
                        withCredentials([usernamePassword(credentialsId: 'ghcr-token', usernameVariable: 'GHCR_USER', passwordVariable: 'GHCR_PASS')]) {
                            // 工作区目录的属主与本容器内的当前用户不一致时，Git 会以
                            // "dubious ownership" 为由拒绝操作。把目录标记为可信来放行，
                            // 好让下面能读到 commit 号用作镜像标签。
                            sh '''
                                git config --global --add safe.directory ${WORKSPACE} || true
                                git config --global --add safe.directory "$(pwd)" || true
                            '''

                            def gitCommit = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()

                            // 镜像名 ghcr.io/<GitHub 用户名>/nightdeal-backend，标签 = commit 短 SHA。
                            // ghcr 要求命名空间全小写，这里统一 toLowerCase 兜底。
                            def image = "ghcr.io/${env.GHCR_USER.toLowerCase()}/nightdeal-backend:${gitCommit}"

                            echo "准备推送镜像: ${image}"

                            // --password-stdin 避免令牌出现在进程命令行中
                            sh 'echo $GHCR_PASS | docker login ghcr.io -u $GHCR_USER --password-stdin'

                            // 只打 commit 短 SHA 标签并推送；与 vimpaste 一致不打 latest
                            sh "docker build -t ${image} ."
                            sh "docker push ${image}"

                            sh "docker logout ghcr.io"
                        }
                    }
                }
            }
        }

        // GitOps 落地：把 k3s-home 中 nightdeal-backend 的镜像更新为本次构建的
        // 镜像，并直接 commit + push 到 k3s-home main；清单已是当前镜像时跳过。
        stage('6. 更新 GitOps 清单') {
            when {
                branch 'main'
            }

            steps {
                container('gitops') {
                    withCredentials([
                        usernamePassword(
                            credentialsId: 'k3s-home-write',
                            usernameVariable: 'GITOPS_USER',
                            passwordVariable: 'GITOPS_TOKEN'
                        )
                    ]) {
                        sh '''
                            set -eu

                            rm -rf gitops-repo

                            cat > /tmp/git-askpass.sh <<'EOF'
#!/bin/sh
case "$1" in
  *Username*) echo "$GITOPS_USER" ;;
  *Password*) echo "$GITOPS_TOKEN" ;;
esac
EOF

                            chmod 700 /tmp/git-askpass.sh
                            trap 'rm -f /tmp/git-askpass.sh' EXIT

                            GIT_ASKPASS=/tmp/git-askpass.sh \
                            GIT_TERMINAL_PROMPT=0 \
                            git clone https://github.com/kaiwenyao/k3s-home.git gitops-repo

                            # gitops 容器与 docker 容器一样以 root 运行，而工作区
                            # 属主是 jnlp 的 jenkins 用户：不先标记 safe.directory，
                            # 下面的 git rev-parse 会因 dubious ownership 失败
                            #（同 Stage 5 的处理）。
                            git config --global --add safe.directory ${WORKSPACE} || true
                            git config --global --add safe.directory "$(pwd)" || true

                            NEW_IMAGE="ghcr.io/kaiwenyao/nightdeal-backend:$(git rev-parse --short HEAD)"

                            echo "部署镜像: $NEW_IMAGE"

                            # nightdeal 的 K8s 清单尚未入库 k3s-home（需要先规划
                            # namespace / Postgres / Redis / Secret），届时提交
                            # apps/nightdeal/deployment.yaml 后本 stage 自动生效。
                            if [ ! -f gitops-repo/apps/nightdeal/deployment.yaml ]; then
                                echo "k3s-home 中还没有 apps/nightdeal/deployment.yaml，跳过 GitOps 更新"
                                echo "（后端上 k3s 时先提交该清单，其中 image 行需形如"
                                echo " image: ghcr.io/kaiwenyao/nightdeal-backend:<commit>）"
                                exit 0
                            fi

                            sed -i \
                              "s#image: ghcr.io/kaiwenyao/nightdeal-backend:.*#image: ${NEW_IMAGE}#" \
                              gitops-repo/apps/nightdeal/deployment.yaml

                            if git -C gitops-repo diff --quiet -- apps/nightdeal/deployment.yaml; then
                                echo "GitOps 清单已经是当前镜像，无需更新"
                                exit 0
                            fi

                            git -C gitops-repo config user.name "Jenkins"
                            git -C gitops-repo config user.email "jenkins@nightdeal.local"

                            git -C gitops-repo add apps/nightdeal/deployment.yaml
                            git -C gitops-repo commit -m "deploy(nightdeal-backend): ${NEW_IMAGE##*:}"

                            GIT_ASKPASS=/tmp/git-askpass.sh \
                            GIT_TERMINAL_PROMPT=0 \
                            git -C gitops-repo push origin main
                        '''
                    }
                }
            }
        }
    }

    post {
        success {
            echo "✅ 测试、构建、镜像推送与 GitOps 更新成功"
        }
        failure {
            echo "❌ 测试、构建或推送失败，请检查日志"
        }
        always {
            // cleanWs 需要 node 上下文，pod 失败场景下用 try/catch 兜底，
            // 否则会抛 MissingContextVariableException 把已经 ABORTED 的构建再失败一次
            script {
                try {
                    cleanWs() // 清理工作空间
                } catch (e) {
                    echo "工作区清理跳过（pod 可能已回收）: ${e.message}"
                }
            }
        }
    }
}