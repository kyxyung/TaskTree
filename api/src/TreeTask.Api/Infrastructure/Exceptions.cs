using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace TreeTask.Api.Infrastructure;

public class NotFoundException(string message) : Exception(message);

/// <summary>A business rule was broken (e.g. illegal state transition).</summary>
public class BusinessRuleException(string message) : Exception(message);

/// <summary>Maps exceptions to consistent RFC 7807 problem responses.</summary>
public class ApiExceptionHandler(ILogger<ApiExceptionHandler> logger, IProblemDetailsService problems) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext ctx, Exception ex, CancellationToken ct)
    {
        var (status, title, detail) = ex switch
        {
            NotFoundException => (StatusCodes.Status404NotFound, "Not found", ex.Message),
            BusinessRuleException => (StatusCodes.Status409Conflict, "Business rule violated", ex.Message),
            BadHttpRequestException => (StatusCodes.Status400BadRequest, "Bad request", "The request body is malformed or has invalid values."),
            _ => (StatusCodes.Status500InternalServerError, "Server error", "An unexpected error occurred.")
        };

        if (status == StatusCodes.Status500InternalServerError)
            logger.LogError(ex, "Unhandled exception");

        ctx.Response.StatusCode = status;
        return await problems.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = ctx,
            ProblemDetails = new ProblemDetails { Status = status, Title = title, Detail = detail }
        });
    }
}
