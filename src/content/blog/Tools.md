---
title: "Tools"
description: "开发或者学习中用到的工具安装流程记录"
pubDatetime: 2022-09-25T15:20:35Z
modDatetime: 2024-01-30T12:46:00Z
tags:
  - tool
---

## Table of contents

# Homebrew

mac 标准安装脚本

```bash
/bin/zsh -c "$(curl -fsSL https://gitee.com/cunkai/HomebrewCN/raw/master/Homebrew.sh)"
```

mac 卸载脚本

```bash
/bin/zsh -c "$(curl -fsSL https://gitee.com/cunkai/HomebrewCN/raw/master/HomebrewUninstall.sh)"
```

如果遇到报错中含有errno **54** / **443** / 的问题，这种一般切换源以后没有问题，因为都是公益服务器，不稳定性很大。

使用中科大国内源

```bash
/bin/zsh -c "$(curl -fsSL https://gitee.com/cunkai/HomebrewCN/raw/master/Homebrew.sh)"
```

> brew help查看帮助
>
> brew -v查看版本
>
> brew update更新brew
>
> brew install <包>安装
>
> brew uninstall <包名>卸载
>
> brew outdated查询可更新的包
>
> brew upgrade 全部更新包
> brew upgrade 包名 指定包更新包
>
> brew cleanup清理旧版本
>
> brew info 包名查看包信息
>
> brew list查看安装列表
>
> brew search <包名>查询可用包

# nvm

nvm 安装命令，版本号可以从官方最新看到。

```bash
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.39.1/install.sh | bash
```

安装中提示

```
 Failed to connect to raw.githubusercontent.com port 443 after 23 ms: Couldn't connect to server
```

可以使用

```bash
brew install nvm
```

首先要保证之前没有安装过node，如果之前安装过，就先 brew uninstall node。

安装成功之后，环境配置文件 .zshrc 中添加

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
```

# node

```bash
nvm install node
```

如果出现卡住无法下载，改国内源。

mac 只需要执行下面这句话就行了

```bash
export NVM_NODEJS_ORG_MIRROR=https://npm.taobao.org/mirrors/node/
```

windows 需要在nvm的安装路径下，找到settings.txt打开，在后面加加上

```
node_mirror: https://npm.taobao.org/mirrors/node/
npm_mirror: https://npm.taobao.org/mirrors/npm/
```

# Navicat导出ncx解析数据库密码

网址：https://tool.lu/coderunner/

代码

```php
<?php
class NavicatPassword
{
    protected $version = 0;
    protected $aesKey = 'libcckeylibcckey';
    protected $aesIv = 'libcciv libcciv ';
    protected $blowString = '3DC5CA39';
    protected $blowKey = null;
    protected $blowIv = null;

    public function __construct($version = 12)
    {
        $this->version = $version;
        $this->blowKey = sha1('3DC5CA39', true);
        $this->blowIv = hex2bin('d9c7c3c8870d64bd');
    }

    public function encrypt($string)
    {
        $result = FALSE;
        switch ($this->version) {
            case 11:
                $result = $this->encryptEleven($string);
                break;
            case 12:
                $result = $this->encryptTwelve($string);
                break;
            default:
                break;
        }

        return $result;
    }

    protected function encryptEleven($string)
    {
        $round = intval(floor(strlen($string) / 8));
        $leftLength = strlen($string) % 8;
        $result = '';
        $currentVector = $this->blowIv;

        for ($i = 0; $i < $round; $i++) {
            $temp = $this->encryptBlock($this->xorBytes(substr($string, 8 * $i, 8), $currentVector));
            $currentVector = $this->xorBytes($currentVector, $temp);
            $result .= $temp;
        }

        if ($leftLength) {
            $currentVector = $this->encryptBlock($currentVector);
            $result .= $this->xorBytes(substr($string, 8 * $i, $leftLength), $currentVector);
        }

        return strtoupper(bin2hex($result));
    }

    protected function encryptBlock($block)
    {
        return openssl_encrypt($block, 'BF-ECB', $this->blowKey, OPENSSL_RAW_DATA|OPENSSL_NO_PADDING);
    }

    protected function decryptBlock($block)
    {
        return openssl_decrypt($block, 'BF-ECB', $this->blowKey, OPENSSL_RAW_DATA|OPENSSL_NO_PADDING);
    }

    protected function xorBytes($str1, $str2)
    {
        $result = '';
        for ($i = 0; $i < strlen($str1); $i++) {
            $result .= chr(ord($str1[$i]) ^ ord($str2[$i]));
        }

        return $result;
    }

    protected function encryptTwelve($string)
    {
        $result = openssl_encrypt($string, 'AES-128-CBC', $this->aesKey, OPENSSL_RAW_DATA, $this->aesIv);
        return strtoupper(bin2hex($result));
    }

    public function decrypt($string)
    {
        $result = FALSE;
        switch ($this->version) {
            case 11:
                $result = $this->decryptEleven($string);
                break;
            case 12:
                $result = $this->decryptTwelve($string);
                break;
            default:
                break;
        }

        return $result;
    }

    protected function decryptEleven($upperString)
    {
        $string = hex2bin(strtolower($upperString));

        $round = intval(floor(strlen($string) / 8));
        $leftLength = strlen($string) % 8;
        $result = '';
        $currentVector = $this->blowIv;

        for ($i = 0; $i < $round; $i++) {
            $encryptedBlock = substr($string, 8 * $i, 8);
            $temp = $this->xorBytes($this->decryptBlock($encryptedBlock), $currentVector);
            $currentVector = $this->xorBytes($currentVector, $encryptedBlock);
            $result .= $temp;
        }

        if ($leftLength) {
            $currentVector = $this->encryptBlock($currentVector);
            $result .= $this->xorBytes(substr($string, 8 * $i, $leftLength), $currentVector);
        }

        return $result;
    }

    protected function decryptTwelve($upperString)
    {
        $string = hex2bin(strtolower($upperString));
        return openssl_decrypt($string, 'AES-128-CBC', $this->aesKey, OPENSSL_RAW_DATA, $this->aesIv);
    }
};


//需要指定版本两种，11或12
//$navicatPassword = new NavicatPassword(11);
//这里我指定的12的版本，原先指定的11，执行之后的密码是乱码
$navicatPassword = new NavicatPassword(12);

//解密
//$decode = $navicatPassword->decrypt('5658213B');
$decode = $navicatPassword->decrypt('复制出来的密码');
echo $decode."\n";
?>
```

# oh-my-zsh

安装 oh-my-zsh（二选一），安装之前最好备份一下已有的配置文件，虽然目前 oh-my-zsh 会自动生成一个文件存放之前的配置。

```bash
##github sh脚本安装
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

##手动安装
git clone --depth=1 https://github.com/ohmyzsh/ohmyzsh.git ~/.oh-my-zsh

##创建zsh配置文件
cp ~/.oh-my-zsh/templates/zshrc.zsh-template ~/.zshrc
```

**oh-my-zsh内置自动补全**

- **自动列出目录：**输入 cd 按 tab 键，目录将自动列出，在按 tab 可以切换。
- **自动补全目录：**例如 /opt/local/bin 这个长路径，只需要 cd /o/l/b 按 tab 键自动补全

**zsh-completions：额外补全**（二选一）

```bash
##下载安装
git clone --depth=1 https://github.com/zsh-users/zsh-completions ${ZSH_CUSTOM:-${ZSH:-~/.oh-my-zsh}/custom}/plugins/zsh-completions

##添加目录
fpath+=${ZSH_CUSTOM:-${ZSH:-~/.oh-my-zsh}/custom}/plugins/zsh-completions/src

##激活
source "$ZSH/oh-my-zsh.sh"

##brew下载安装
brew install zsh-completions
```

**zsh-autosuggestions：历史补全**

```bash
##下载安装
git clone --depth=1 https://github.com/zsh-users/zsh-autosuggestions.git ${ZSH_CUSTOM:-${ZSH:-~/.oh-my-zsh}/custom}/plugins/zsh-autosuggestions

##vi进去 .zshrc配置文件 配置zsh-autosuggestions
plugins=(
    git
    # other plugins...
    zsh-autosuggestions
)
```

**Incremental completion on zsh:实时补全**

```bash
##创建文件夹
mkdir $ZSH_CUSTOM/plugins/incr

##下载
curl -fsSL https://mimosa-pudica.net/src/incr-0.2.zsh -o $ZSH_CUSTOM/plugins/incr/incr.zsh

##配置
echo 'source $ZSH_CUSTOM/plugins/incr/incr.zsh' >> ~/.zshrc

##激活
source ~/.zshrc
```

**zsh-syntax-highlighting：语法高亮**

命令错误显示红色，直至正确才为绿色，路径正确会添加下划线

```bash
##下载安装
git clone --depth=1 https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting

##vi进去配置zsh-syntax-highlighting
plugins=([plugins...]
         zsh-syntax-highlighting)
```

**安装 Powerlevel10k**

Github

```bash
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
```

gitee

```bash
git clone --depth=1 https://gitee.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
```

修改 .zshrc 配置文件

```bash
ZSH_THEME=powerlevel10k/powerlevel10k
```

**安装nerd font**

Powerlevel10k 需要依赖 nerd font

```bash
>git clone https://github.com/ryanoasis/nerd-fonts.git --depth 1
>cd nerd-fonts
>./install.sh
```

终端设置选择字体即可

![image-20230918224852566](https://cdn.jsdelivr.net/gh/chou401/pic-md@master/image-20230918224852566.png)

# vim 配置

创建 .vimrc 配置文件

```bash
" Configuration file for vim
set modelines=0		" CVE-2007-2438

" Normally we use vim-extensions. If you want true vi-compatibility
" remove change the following statements
set nocompatible	" Use Vim defaults instead of 100% vi compatibility
set backspace=2		" more powerful backspacing

" Don't write backup file if vim is being called by "crontab -e"
au BufWrite /private/tmp/crontab.* set nowritebackup nobackup
" Don't write backup file if vim is being called by "chpass"
au BufWrite /private/etc/pw.* set nowritebackup nobackup

let skip_defaults_vim=1

colorscheme default     " 设置颜色主题
syntax on               " 语法高亮

filetype on             " 检测文件的类型
set number              " 显示行号
set cursorline          " 用浅色高亮当前行
"autocmd InsertLeave * se nocul
"autocmd InsertEnter * se cul
set ruler               " 在编辑过程中，在右下角显示光标位置的状态行
set laststatus=2        " 显示状态栏 (默认值为 1, 无法显示状态栏)
set statusline=\ %<%F[%1*%M%*%n%R%H]%=\ %y\ %0(%{&fileformat}\ %{&encoding}\ %c:%l/%L%)\
                        " 设置在状态行显示的信息

set tabstop=4           " Tab键的宽度
set softtabstop=4
set shiftwidth=4        " 统一缩进为4

set autoindent          " vim使用自动对齐，也就是把当前行的对齐格式应用到下一行(自动缩进)
set cindent             " (cindent是特别针对 C语言语法自动缩进)
set smartindent         " 依据上面的对齐格式，智能的选择对齐方式，对于类似C语言编写上有用
set scrolloff=3         " 光标移动到buffer的顶部和底部时保持3行距离

set incsearch           " 输入搜索内容时就显示搜索结果
set hlsearch            " 搜索时高亮显示被找到的文本

set foldmethod=indent   " 设置缩进折叠
set foldlevel=99        " 设置折叠层数
nnoremap <space> @=((foldclosed(line('.')) < 0) ? 'zc' : 'zo')<CR>
                        " 用空格键来开关折叠
" 自动跳转到上次退出的位置
if has("autocmd")
    au BufReadPost * if line("'\"") > 1 && line("'\"") <= line("$") | exe "normal! g'\"" | endif
endif
```

# redis

**执行安装命令**

```bash
brew install redis
```

**查看安装到的目录**

```bash
❯ brew list redis

/opt/homebrew/Cellar/redis/7.2.3/.bottle/etc/ (2 files)
/opt/homebrew/Cellar/redis/7.2.3/bin/redis-benchmark
/opt/homebrew/Cellar/redis/7.2.3/bin/redis-check-aof
/opt/homebrew/Cellar/redis/7.2.3/bin/redis-check-rdb
/opt/homebrew/Cellar/redis/7.2.3/bin/redis-cli
/opt/homebrew/Cellar/redis/7.2.3/bin/redis-sentinel
/opt/homebrew/Cellar/redis/7.2.3/bin/redis-server
/opt/homebrew/Cellar/redis/7.2.3/homebrew.mxcl.redis.plist
/opt/homebrew/Cellar/redis/7.2.3/homebrew.redis.service
/opt/homebrew/Cellar/redis/7.2.3/logs/ (2 files)
```

/opt/homebrew/Cellar/redis/7.2.3/homebrew.mxcl.redis.plist 这个文件比较关键，是设置开机自启动的关键。

**设置开机自启动**

查看文件中的内容

```bash
/opt/homebrew/Cellar/redis/7.2.3/homebrew.mxcl.redis.plist
```

创建 .plist 文件

```bash
sudo vi /Library/LaunchDaemons/io.redis.redis-server.plist
```

将下面的配置内容拷贝到 io.redis.redis-server.plist 文件中

```bash
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>io.redis.redis-server</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/opt/redis/bin/redis-server</string>
        <string>/opt/homebrew/etc/redis.conf</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

检查路径是否正确

```bash
<string>/opt/homebrew/opt/redis/bin/redis-server</string>
<string>/opt/homebrew/etc/redis.conf</string>
```

要与 /opt/homebrew/Cellar/redis/7.2.3/homebrew.mxcl.redis.plist 文件中的路径是一样的

执行开机自启动命令

```bash
sudo launchctl load /Library/LaunchDaemons/io.redis.redis-server.plist使用launchctl手动启动/关闭redis
```

- 启动 redisz

  ```bash
  sudo launchctl start io.redis.redis-server
  ```

- 关闭 redis

  ```bash
  sudo launchctl stop io.redis.redis-server
  ```

对上述命令进行简化（别名）

```bash
vim ~/.zshrc

alias redisstart='sudo launchctl start io.redis.redis-server'
alias redisstop='sudo launchctl stop io.redis.redis-server'

source ~/.zshrc
```

# kafka

**mac安装kafka运行错误@@HOMEBREW_JAVA@@/bin/java: No such file or directory**

描述：安装brew使用的中科大的镜像，直接通过`brew install kafka`后执行启动命令`brew services start kafka`报错

解决：mac终端执行命令:`HOMEBREW_BOTTLE_DOMAIN= brew reinstall kafka`
