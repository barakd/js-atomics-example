"use strict";

importScripts("utils.js", "shared.js", "mandelbrot.js");

onmessage = dispatchMessage;

var magnification, sync, slices, grid;

function runWorker(shmem, ID) {
    // Variables in shared memory
    magnification = new Float64Array(shmem, magnification_OFFSET, 1);
    sync          = new Int32Array(shmem, sync_OFFSET, Sync_INTS);
    slices        = new Int32Array(shmem, slices_OFFSET, NumSlices * Slice_INTS);
    grid          = new Int32Array(shmem, grid_OFFSET, Grid_INTS);

    for (;;) {
        waitForWork(ID);
        var idx;
        while ((idx = Atomics.load(sync, Sync_next)) < NumSlices) {
            if (Atomics.compareExchange(sync, Sync_next, idx, idx+1) == idx) {
                var ybase  = slices[idx * Slice_INTS + Slice_ybase];
                var ylimit = slices[idx * Slice_INTS + Slice_ylimit];
                mandelbrot(grid, ybase, ylimit, magnification[0]);
            }
        }
        postMessage(["workerDone"]);
    }
}

function waitForWork(ID) {
    Atomics.wait(sync, Sync_wait + ID, 0);
    Atomics.store(sync, Sync_wait + ID, 0);
}