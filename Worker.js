/**
 * Web Worker后台处理脚本
 * 用于执行耗时的计算任务，避免阻塞主线程
 */

// 监听主线程发送的消息
self.addEventListener('message', function(e) {
  const { command, data, id } = e.data;
  
  try {
    switch (command) {
      case 'calculate':
        handleCalculate(data, id);
        break;
        
      case 'processData':
        handleProcessData(data, id);
        break;
        
      case 'simulateWork':
        handleSimulateWork(data, id);
        break;
        
      case 'fibonacci':
        handleFibonacci(data, id);
        break;
        
      case 'primeNumbers':
        handlePrimeNumbers(data, id);
        break;
        
      case 'sortArray':
        handleSortArray(data, id);
        break;
        
      default:
        self.postMessage({
          id: id || 'unknown',
          status: 'error',
          error: `未知命令: ${command}`,
          timestamp: new Date().toISOString()
        });
    }
  } catch (error) {
    self.postMessage({
      id: id || 'unknown',
      status: 'error',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 处理计算任务
 */
function handleCalculate(data, id) {
  const { operation, numbers } = data;
  let result;
  
  switch (operation) {
    case 'sum':
      result = numbers.reduce((acc, num) => acc + num, 0);
      break;
      
    case 'average':
      result = numbers.reduce((acc, num) => acc + num, 0) / numbers.length;
      break;
      
    case 'max':
      result = Math.max(...numbers);
      break;
      
    case 'min':
      result = Math.min(...numbers);
      break;
      
    case 'multiply':
      result = numbers.reduce((acc, num) => acc * num, 1);
      break;
      
    default:
      throw new Error(`不支持的操作: ${operation}`);
  }
  
  self.postMessage({
    id,
    status: 'success',
    command: 'calculate',
    result: result,
    operation: operation,
    timestamp: new Date().toISOString()
  });
}

/**
 * 处理数据批量处理
 */
function handleProcessData(data, id) {
  const { dataset, transform } = data;
  const processed = [];
  
  for (let i = 0; i < dataset.length; i++) {
    let value = dataset[i];
    
    // 应用转换函数
    if (transform === 'double') {
      value = value * 2;
    } else if (transform === 'square') {
      value = value * value;
    } else if (transform === 'sqrt') {
      value = Math.sqrt(Math.abs(value));
    } else if (transform === 'normalize') {
      // 找到最大值进行归一化
      const max = Math.max(...dataset.map(Math.abs));
      value = max !== 0 ? value / max : 0;
    }
    
    processed.push(Number(value.toFixed(4)));
    
    // 定期发送进度更新（每处理10%的数据）
    if (dataset.length > 10 && i % Math.floor(dataset.length / 10) === 0) {
      const progress = Math.floor((i / dataset.length) * 100);
      self.postMessage({
        id,
        status: 'progress',
        progress: progress,
        processed: i + 1,
        total: dataset.length,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  self.postMessage({
    id,
    status: 'success',
    command: 'processData',
    result: processed,
    originalLength: dataset.length,
    timestamp: new Date().toISOString()
  });
}

/**
 * 模拟耗时工作
 */
function handleSimulateWork(data, id) {
  const { duration = 3000, steps = 100 } = data;
  const stepDuration = duration / steps;
  let currentStep = 0;
  
  const intervalId = setInterval(() => {
    currentStep++;
    const progress = Math.floor((currentStep / steps) * 100);
    
    // 模拟一些计算
    let dummyResult = 0;
    for (let i = 0; i < 10000; i++) {
      dummyResult += Math.sin(i) * Math.cos(i);
    }
    
    self.postMessage({
      id,
      status: 'progress',
      progress: progress,
      currentStep: currentStep,
      totalSteps: steps,
      dummyResult: dummyResult.toFixed(6),
      timestamp: new Date().toISOString()
    });
    
    if (currentStep >= steps) {
      clearInterval(intervalId);
      self.postMessage({
        id,
        status: 'success',
        command: 'simulateWork',
        result: '模拟工作完成',
        totalDuration: duration,
        timestamp: new Date().toISOString()
      });
    }
  }, stepDuration);
}

/**
 * 计算斐波那契数列
 */
function handleFibonacci(data, id) {
  const { n = 20 } = data;
  
  if (n < 0 || n > 1000) {
    throw new Error('n必须在0到1000之间');
  }
  
  function fib(num) {
    if (num <= 1) return num;
    let a = 0, b = 1;
    for (let i = 2; i <= num; i++) {
      [a, b] = [b, a + b];
    }
    return b;
  }
  
  const sequence = [];
  for (let i = 0; i <= n; i++) {
    sequence.push(fib(i));
    
    // 定期报告进度
    if (n > 10 && i % Math.floor(n / 10) === 0) {
      const progress = Math.floor((i / n) * 100);
      self.postMessage({
        id,
        status: 'progress',
        progress: progress,
        current: i,
        total: n,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  self.postMessage({
    id,
    status: 'success',
    command: 'fibonacci',
    result: sequence,
    length: sequence.length,
    nthValue: sequence[n],
    timestamp: new Date().toISOString()
  });
}

/**
 * 查找质数
 */
function handlePrimeNumbers(data, id) {
  const { limit = 100 } = data;
  
  if (limit < 2 || limit > 100000) {
    throw new Error('limit必须在2到100000之间');
  }
  
  const isPrime = new Array(limit + 1).fill(true);
  isPrime[0] = isPrime[1] = false;
  const primes = [];
  
  for (let i = 2; i <= limit; i++) {
    if (isPrime[i]) {
      primes.push(i);
      for (let j = i * i; j <= limit; j += i) {
        isPrime[j] = false;
      }
    }
    
    // 定期报告进度
    if (limit > 100 && i % Math.floor(limit / 10) === 0) {
      const progress = Math.floor((i / limit) * 100);
      self.postMessage({
        id,
        status: 'progress',
        progress: progress,
        current: i,
        total: limit,
        primesFound: primes.length,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  self.postMessage({
    id,
    status: 'success',
    command: 'primeNumbers',
    result: primes,
    count: primes.length,
    limit: limit,
    timestamp: new Date().toISOString()
  });
}

/**
 * 排序数组
 */
function handleSortArray(data, id) {
  const { array, algorithm = 'quick' } = data;
  
  if (!Array.isArray(array)) {
    throw new Error('输入必须是一个数组');
  }
  
  let sortedArray;
  const startTime = performance.now();
  
  switch (algorithm) {
    case 'quick':
      sortedArray = quickSort([...array]);
      break;
      
    case 'merge':
      sortedArray = mergeSort([...array]);
      break;
      
    case 'bubble':
      sortedArray = bubbleSort([...array]);
      break;
      
    default:
      sortedArray = [...array].sort((a, b) => a - b);
  }
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  self.postMessage({
    id,
    status: 'success',
    command: 'sortArray',
    result: sortedArray,
    algorithm: algorithm,
    originalLength: array.length,
    duration: duration.toFixed(2) + 'ms',
    timestamp: new Date().toISOString()
  });
}

// 快速排序实现
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = [];
  const right = [];
  const equal = [];
  
  for (const element of arr) {
    if (element < pivot) {
      left.push(element);
    } else if (element > pivot) {
      right.push(element);
    } else {
      equal.push(element);
    }
  }
  
  return [...quickSort(left), ...equal, ...quickSort(right)];
}

// 归并排序实现
function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  
  return merge(left, right);
}

function merge(left, right) {
  const result = [];
  let i = 0, j = 0;
  
  while (i < left.length && j < right.length) {
    if (left[i] < right[j]) {
      result.push(left[i]);
      i++;
    } else {
      result.push(right[j]);
      j++;
    }
  }
  
  return result.concat(left.slice(i)).concat(right.slice(j));
}

// 冒泡排序实现
function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}

// Worker初始化完成，通知主线程
self.postMessage({
  id: 'init',
  status: 'ready',
  message: 'Worker已初始化，等待任务',
  supportedCommands: ['calculate', 'processData', 'simulateWork', 'fibonacci', 'primeNumbers', 'sortArray'],
  timestamp: new Date().toISOString()
});

// 错误处理
self.addEventListener('error', function(e) {
  self.postMessage({
    id: 'system',
    status: 'error',
    error: 'Worker内部错误',
    message: e.message,
    timestamp: new Date().toISOString()
  });
});

// 未捕获的异常处理
self.addEventListener('unhandledrejection', function(e) {
  self.postMessage({
    id: 'system',
    status: 'error',
    error: '未处理的Promise拒绝',
    reason: e.reason,
    timestamp: new Date().toISOString()
  });
});
